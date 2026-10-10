# Money Tracker Backend Overview

This document describes how the Money Tracker backend is built: what it does, how the code is organized, which external services it talks to, and what is finished vs. still in progress.

For the original requirements and the high-level architecture diagram, see [`docs/backend/backend_requirements.md`](../../docs/backend/backend_requirements.md) and [`docs/backend/system_design.md`](../../docs/backend/system_design.md) at the repo root.

---

## What the backend does

The backend is a Node.js / Express API that powers the Money Tracker app. It has four main jobs:

1. **Accounts and auth.** Users sign up and log in with a phone number and password. The API issues short-lived JWT access tokens and long-lived refresh tokens.
2. **iMessage assistant.** Users can text a personal finance assistant over iMessage. Incoming texts arrive through Photon (the `spectrum-ts` SDK), are processed by Google Gemini, and the reply is texted back. Every message is logged to the database.
3. **Bank data.** Plaid connects a user's bank so the app can show accounts, balances, and recent transactions. This currently runs in Plaid Sandbox.
4. **Student discounts.** A catalog of student offers is pulled from studentoffers.co into the database and exposed through a searchable endpoint.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Runtime | Node.js, ES modules (`"type": "module"`) |
| Web framework | Express 5 (async errors are forwarded to the error handler automatically) |
| Database | MySQL / MariaDB |
| ORM | Prisma 7 with the `@prisma/adapter-mariadb` driver adapter |
| Auth | `jsonwebtoken` (access tokens), `bcrypt` (password hashing), Node `crypto` (refresh tokens) |
| AI | Google Gemini via `@google/genai` (model `gemini-3.8-flash`) |
| Messaging | Photon / Spectrum (`spectrum-ts`) with the iMessage provider |
| Banking | Plaid (`plaid` SDK) |

---

## Project layout

```
backend/
├── prisma/
│   └── schema.prisma        # Database models
├── prisma.config.js         # Prisma CLI config (schema + migrations path, DATABASE_URL)
├── Scripts/
│   └── syncOffers.js        # One-off script: fill the Offer table
├── src/
│   ├── index.js             # App entry: mounts routers, error handler, starts Photon listener
│   ├── db.js                # Shared PrismaClient (one connection pool per process)
│   ├── errors.js            # HttpError class
│   ├── middleware/
│   │   └── requireAuth.js   # Bearer-token check, sets req.userId
│   ├── routers/             # HTTP layer: parse request, call service, send response
│   │   ├── Auth.js
│   │   ├── User.js
│   │   ├── Bank.js
│   │   ├── Offers.js
│   │   ├── Agent.js
│   │   └── Webhooks.js
│   ├── services/            # Business logic and third-party clients
│   │   ├── Auth.js
│   │   ├── User.js
│   │   ├── Password.js
│   │   ├── Token.js
│   │   ├── Offers.js
│   │   ├── Plaid.js
│   │   ├── gemini.js
│   │   ├── photon.js
│   │   └── messages.js
│   └── validators/          # Request body validation
│       ├── Auth.js
│       └── User.js
└── docs/
    └── BACKEND_OVERVIEW.md  # This file
```

### Layering convention

Requests flow through three layers:

```
router  ->  validator  ->  service  ->  prisma / external API
```

- **Routers** stay thin. They call a validator on `req.body`, pass the clean result to a service, and send the response.
- **Validators** take the raw body, collect every field error into one object, and either return clean data or throw `HttpError(400, "Validation failed", fields)`.
- **Services** hold the business logic and all database and third-party calls. When something goes wrong that the client should know about, they throw `HttpError` with the right status.

### Error handling

`src/errors.js` defines `HttpError(status, message, fields)`. The error handler at the bottom of `src/index.js` turns any thrown error into JSON:

- **4xx:** `{ "error": "<message>", "fields": { ...per-field messages } }`
- **5xx:** the error is logged to the console and the client only gets `{ "error": "Internal server error" }`, so internals don't leak.

Because Express 5 forwards rejected promises, async route handlers don't need their own `try/catch`. The exception is `routers/Bank.js`, which still catches Plaid errors itself and returns its own 500 messages.

---

## Running locally

1. Install dependencies from `backend/`:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the values (see below).
3. Generate the Prisma client and apply the schema to your database:
   ```
   npx prisma generate
   npx prisma db push      # or: npx prisma migrate dev
   ```
4. Start the server:
   ```
   npm start         # node --env-file=.env src/index.js
   npm run dev       # same, restarts on file changes
   ```
5. Optionally load student offers:
   ```
   npm run sync:offers
   ```

The server listens on `PORT` (default `3000`). On startup it also opens the Photon connection and starts listening for iMessages.

### Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `PORT` | `index.js` | Defaults to 3000 |
| `DATABASE_URL` | `db.js`, `prisma.config.js` | MySQL/MariaDB connection string |
| `JWT_SECRET` | `services/Token.js` | **Required.** The server throws on startup if it's missing |
| `GEMINI_API_KEY` | `services/gemini.js` | Google Gemini API key |
| `SPECTRUM_PROJECT_ID` | `services/photon.js` | Photon / Spectrum project |
| `SPECTRUM_PROJECT_SECRET` | `services/photon.js` | Photon / Spectrum secret |
| `PLAID_CLIENT_ID` | `services/Plaid.js` | Not in `.env.example` yet |
| `PLAID_SECRET` | `services/Plaid.js` | Not in `.env.example` yet |
| `PLAID_ENV` | `services/Plaid.js` | `sandbox` (default), `development`, or `production` |
| `DEV` | `middleware/requireAuth.js` | When `"true"`, auth is skipped (see below) |
| `DEV_USER_ID` | `middleware/requireAuth.js` | The user id assumed when `DEV=true` |

---

## Authentication

Auth is phone number + password, with a two-token scheme.

| Token | Format | Lifetime | Storage |
| --- | --- | --- | --- |
| Access token | JWT signed with `JWT_SECRET`, `sub` = user id | 15 minutes | Not stored server-side |
| Refresh token | 32 random bytes, base64url | 30 days | SHA-256 hash stored in the `Session` table |

**Flow:**

1. `POST /auth/signup` or `POST /auth/login` creates a `Session` row and returns `{ user, accessToken, refreshToken }`.
2. The client sends `Authorization: Bearer <accessToken>` on protected routes. `requireAuth` verifies it and sets `req.userId`.
3. When the access token expires, the client calls `POST /auth/refresh` with the refresh token to get a new access token. The refresh token itself is not rotated.
4. `POST /auth/logout` sets `revokedAt` on the matching session, so that refresh token stops working.

Each logged-in device gets its own `Session` row.

**Passwords** are hashed with bcrypt (cost 12). Validation enforces at least 8 characters and at most 72 bytes, since bcrypt ignores anything past 72 bytes.

**Phone numbers** are normalized to E.164. Input like `+1 (555) 123-4567` is stored as `+15551234567`, and the country code is required.

**Dev bypass:** if `DEV=true`, `requireAuth` skips token checks and uses `DEV_USER_ID`. Never set this in production.

---

## API reference

Routes marked **stub** exist but only return a placeholder string.

### Auth: `/auth`

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/auth/signup` | – | `name`, `phone`, `password`, `email?` | `201 { user, accessToken, refreshToken }`; `409` if the phone is already registered |
| POST | `/auth/login` | – | `phone`, `password` | `{ user, accessToken, refreshToken }`; `401` on bad credentials |
| POST | `/auth/refresh` | – | `refreshToken` | `{ accessToken }` |
| POST | `/auth/logout` | – | `refreshToken` | `204` |

### Current user: `/me`

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/me` | ✅ | – | `{ user }` |
| PATCH | `/me` | ✅ | `name?`, `email?` (at least one; `null` or `""` clears email) | `{ user }` |
| DELETE | `/me` | ✅ | – | `204`. Cascades to sessions, messages, and the Photon line |
| POST | `/me/welcome` | – | – | **stub** (no response sent) |

User responses never include `passwordHash`. Services only select public columns.

### Bank / Plaid (mounted at root)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/plaid/link-token` | – | Creates a Plaid Link token for the frontend |
| POST | `/plaid/exchange` | – | Body `{ public_token }`. Exchanges it for an access token (see note below) |
| GET | `/accounts` | – | Lists accounts and balances for the connected bank |
| GET | `/transactions` | – | Up to 100 transactions from the last 30 days |
| GET | `/plaid/items` | – | **stub** |
| DELETE | `/plaid/items/:id` | – | **stub** |
| GET | `/accounts/:id/balance` | – | **stub** |
| GET | `/transactions/summary` | – | **stub** |

> **Sandbox-only behavior:** the Plaid access token is currently held in memory on `req.app.locals.plaidDemoConnection`. There is only one connection for the whole server, it isn't tied to a user, and it is lost on restart. The `PlaidItem`, `Account`, and `Transaction` models are written but commented out in `schema.prisma` until bank data is persisted per user.

### Offers: `/offers`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/offers?q=&limit=&offset=` | – | Search by name, offer text, or description. `limit` defaults to 50 (max 200). Returns `{ offers, total }` |
| GET | `/offers/:id` | – | One offer, or `404` |
| POST | `/offers/sync` | – | Re-pulls offers from studentoffers.co and returns `{ synced }` |

### Agent and webhooks

| Method | Path | Description |
| --- | --- | --- |
| POST | `/agent/connect` | **stub**. Meant for linking a user to a Photon line |
| POST | `/webhooks/plaid` | **stub** |
| POST | `/webhooks/spectrum` | **stub** |

---

## iMessage assistant (Photon + Gemini)

The assistant doesn't go through an HTTP route. `startListening()` in `services/photon.js` runs at startup and loops over incoming messages from Spectrum.

```
User texts the Photon number
        │
        ▼
photon.js: startListening() receives the message (text only)
        │
        ├─► messages.js: logMessage(phone, text, "inbound")
        │
        ├─► Look up the user by phone
        │      └─ no account → reply "Sign up and verify your phone number…" and stop
        │
        ▼
gemini.js: handleMessage(text)
        ├─ 1. parseMessage: structured-output call that pulls { name, product, price }
        │                   (fields are null if missing; a parse failure doesn't block the reply)
        └─ 2. askGemini:    writes a short plain-text iMessage reply, given the parsed details
        │
        ▼
space.send(reply) → logMessage(phone, reply, "outbound")
```

Notes:

- `space.responding(...)` shows the typing indicator while Gemini works.
- One Spectrum connection is shared across the process (`getApp()` caches it).
- `sendText(phone, text)` can start a new conversation from the server side. It is used for the welcome message.
- Texts from numbers that don't have an account are not logged.

---

## Student offers

`services/Offers.js` fetches `https://www.studentoffers.co/api/offers`, drops entries missing `id`, `name`, or `offer`, and upserts the rest into the `Offer` table, matched on `externalId`, inside one transaction. It is safe to re-run.

You can trigger it two ways:

- `npm run sync:offers`, which runs `Scripts/syncOffers.js` and disconnects Prisma when done
- `POST /offers/sync`

The long-term plan (see `Backend_Logic.md`) is for the assistant to find coupons and student discounts when users text about something they want to buy. The parser already extracts the company and product, so that's the hook for matching against `Offer`.

---

## Data model

Defined in `prisma/schema.prisma`. Every user-owned table uses `onDelete: Cascade`, so deleting a user removes all of their data. IDs are UUID strings stored as `CHAR(36)`.

| Model | Purpose | Key fields |
| --- | --- | --- |
| `User` | An account | `phone` (unique, E.164), `name`, `email?`, `passwordHash`, `agentOptOut` |
| `Session` | One per logged-in device | `refreshTokenHash` (unique), `expiresAt`, `revokedAt?` |
| `PhoneCode` | SMS verification / password reset codes (**not used yet**) | `phone`, `codeHash`, `purpose`, `expiresAt`, `attempts` |
| `PhotonLine` | Links a user to their iMessage space | `userId` (unique), `photonPhone`, `spaceId` |
| `MessageLog` | Every inbound/outbound assistant text | `userId`, `direction`, `text`, `createdAt` |
| `Offer` | Student discount catalog | `externalId` (unique), `name`, `offer`, `description` |
| `PlaidItem`, `Account`, `Transaction` | Bank connections and data (**commented out**) | – |

Prisma error codes the services handle:

- `P2002` (unique constraint) on signup → `409`
- `P2025` (record not found) on update/delete → `404`

---

## Status and known gaps

**Working**
- Signup, login, refresh, logout, and per-device sessions
- `GET`/`PATCH`/`DELETE /me`
- iMessage assistant end-to-end (receive → parse → reply → log)
- Plaid Sandbox: link token, token exchange, accounts, transactions
- Student offer sync and search

**In progress / not yet built**
- Persisting Plaid data per user (models commented out, token kept in memory)
- Plaid item listing/removal, per-account balance, transaction summary
- `/agent/connect`, `/me/welcome`, and both webhook endpoints
- Phone verification codes (`PhoneCode` model and `validatePhoneCode` exist, but no routes use them)
- Hooking offers into the assistant's replies

**Issues to fix**
- `package.json` is not valid JSON. It's missing a comma after the `plaid` dependency and lists `mariadb` twice. `npm install` will fail until that's fixed.
- `services/Auth.js` calls `sendWelcomeMessage` without importing it from `services/messages.js`. It also passes `user.id` where `messages.js` expects a phone number. The resulting error is caught and logged as "Failed to send phone code", so signup still succeeds, but no welcome text is sent.
- `sendWelcomeMessage` doesn't `await` `sendText`, so send failures become unhandled rejections.
- The Plaid routes and `POST /offers/sync` have no `requireAuth`, so anyone can call them.
- `.env.example` is missing the `PLAID_*` variables.
- There's no `prisma/migrations` folder yet. The schema has to be applied with `prisma db push` or a first `migrate dev`.
