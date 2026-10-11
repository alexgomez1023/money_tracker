# Money Tracker Backend Overview

This document describes how the Money Tracker backend is built: what it does, how the code is organized, which external services it talks to, and what is finished vs. still in progress.

For the original requirements and the high-level architecture diagram, see [`backend_requirements.md`](backend_requirements.md) and [`system_design.md`](system_design.md) in this folder.

---

## What the backend does

The backend is a Node.js / Express API that powers the Money Tracker app. It has five main jobs:

1. **Accounts and auth.** Users sign up and log in with a phone number and password. The API issues short-lived JWT access tokens and long-lived refresh tokens. Signing up also registers the user with Photon and returns the iMessage number assigned to them.
2. **iMessage assistant.** Users can text a personal finance assistant over iMessage. Incoming texts arrive through Photon (the `spectrum-ts` SDK). Gemini pulls out the store or product the user is asking about, the backend looks up matching student offers, and Gemini writes the reply. Every message is logged to the database.
3. **Bank data.** Plaid connects a user's bank. Each connection is saved per user, with the Plaid access token encrypted at rest, and accounts, balances, and transactions are synced into the database. This currently runs in Plaid Sandbox.
4. **Student discounts.** A catalog of student offers is pulled from studentoffers.co into the database and exposed through an endpoint.
5. **Hourly offers job.** A background job refreshes the offer catalog and every user's transactions once an hour, then looks for offers that match the merchants on new transactions. Right now it only logs the matches; sending them to the user is the next step.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Runtime | Node.js, ES modules (`"type": "module"`) |
| Web framework | Express 5 (async errors are forwarded to the error handler automatically) |
| Database | MySQL / MariaDB |
| ORM | Prisma 7 with the `@prisma/adapter-mariadb` driver adapter |
| Auth | `jsonwebtoken` (access tokens), `bcrypt` (password hashing), Node `crypto` (refresh tokens) |
| Encryption | Node `crypto`, AES-256-GCM (Plaid access tokens) |
| AI | Google Gemini via `@google/genai` (model `gemini-3.8-flash`) |
| Messaging | Photon / Spectrum (`spectrum-ts`) with the iMessage provider, plus the Spectrum REST API for creating users |
| Banking | Plaid (`plaid` SDK, `/transactions/sync`) |

---

## Project layout

```
backend/
├── prisma/
│   └── schema.prisma             # Database models
├── prisma.config.js              # Prisma CLI config (schema + migrations path, DATABASE_URL)
├── Scripts/
│   ├── syncOffers.js             # One-off script: fill the Offer table
│   └── seedTestUser.js           # Creates a test user with a linked Sandbox bank and sample transactions
└── src/
    ├── index.js                  # App entry: mounts routers, error handler, starts Photon listener and offers job
    ├── db.js                     # Shared PrismaClient (one connection pool per process)
    ├── errors.js                 # HttpError class
    ├── middleware/
    │   └── requireAuth.js        # Bearer-token check, sets req.userId
    ├── routers/                  # HTTP layer: parse request, call service, send response
    │   ├── Auth.js
    │   ├── User.js
    │   ├── Bank.js
    │   ├── Offers.js
    │   ├── Agent.js
    │   └── Webhooks.js
    ├── services/                 # Business logic and third-party clients
    │   ├── Auth.js
    │   ├── User.js
    │   ├── Password.js
    │   ├── Token.js
    │   ├── Offers.js             # Offer sync, offer lookup, hourly offers job
    │   ├── Plaid.js              # Plaid client, token encryption, bank/account/transaction sync
    │   ├── gemini.js             # Parser and reply agents
    │   ├── message_orchestrator.js  # Runs parse → offer lookup → reply for one text
    │   ├── photon.js             # Spectrum connection, listener, sendText, addPhotonUser
    │   └── messages.js           # Message logging, welcome text
    └── validators/               # Request body validation
        ├── Auth.js
        └── User.js
```

This document lives at `docs/backend/backend_description.md` in the repo root.

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

Because Express 5 forwards rejected promises, async route handlers don't need their own `try/catch`. `routers/Bank.js` now follows this too: Plaid errors bubble up to the shared error handler as 500s.

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
5. Optionally load data:
   ```
   npm run sync:offers   # fill the Offer table
   npm run seed:user     # create a test user with a linked Sandbox bank
   ```

The server listens on `PORT` (default `3000`). On startup it also opens the Photon connection, starts listening for iMessages, and runs the offers job once (then every hour).

### Test user

`npm run seed:user` runs `Scripts/seedTestUser.js`, which is safe to re-run:

- Upserts a user with phone `+15555550100` and password `testpass123`.
- If that user has no bank yet, creates a Sandbox public token for "First Platypus Bank" (`ins_109508`) and links it with `connectBank`.
- Retries the transaction sync a few times (up to 6 × 5s), since Sandbox transactions take a moment to appear.
- Deletes and re-creates five `seed-` transactions (Spotify, Nike, Starbucks, Hulu, Adobe) stamped as just added, so the next offers job run has merchants to match.

### Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `PORT` | `index.js` | Defaults to 3000 |
| `DATABASE_URL` | `db.js`, `prisma.config.js` | MySQL/MariaDB connection string |
| `JWT_SECRET` | `services/Token.js` | **Required.** The server throws on startup if it's missing |
| `GEMINI_API_KEY` | `services/gemini.js` | Google Gemini API key |
| `SPECTRUM_PROJECT_ID` | `services/photon.js` | Photon / Spectrum project. Also used for the REST call that creates users |
| `SPECTRUM_PROJECT_SECRET` | `services/photon.js` | Photon / Spectrum secret |
| `PLAID_CLIENT_ID` | `services/Plaid.js` | Plaid client id |
| `PLAID_SECRET` | `services/Plaid.js` | Plaid secret for the chosen environment |
| `PLAID_TOKEN_SECRET` | `services/Plaid.js` | **Required.** Key material for encrypting Plaid access tokens. The server (and both scripts, since `Offers.js` imports `Plaid.js`) throws on startup if it's missing. Changing it makes saved tokens unreadable |
| `PLAID_ENV` | `services/Plaid.js` | `sandbox` (default), `development`, or `production`. Not in `.env.example` |
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

**Signup and Photon:** after the `User` row is created, `signupUser` calls `addPhotonUser(phone, name)` in `services/photon.js`. That POSTs to `https://spectrum.photon.codes/projects/<id>/users/` (Basic auth with the project id and secret) to create a shared-line user, and returns the iMessage number Photon assigned. The signup response includes it as `agentPhone`. If the Photon call fails, signup returns `409 "Unable to setup messaging agent. Please try again."` (see the known issue below).

**Passwords** are hashed with bcrypt (cost 12). Validation enforces at least 8 characters and at most 72 bytes, since bcrypt ignores anything past 72 bytes.

**Phone numbers** are normalized to E.164. Input like `+1 (555) 123-4567` is stored as `+15551234567`, and the country code is required.

**Dev bypass:** if `DEV=true`, `requireAuth` skips token checks and uses `DEV_USER_ID`. Never set this in production.

---

## API reference

Routes marked **stub** exist but only return a placeholder string.

### Auth: `/auth`

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/auth/signup` | – | `name`, `phone`, `password`, `email?` | `201 { user, agentPhone, accessToken, refreshToken }`; `409` if the phone is already registered or Photon setup fails |
| POST | `/auth/login` | – | `phone`, `password` | `{ user, accessToken, refreshToken }`; `401` on bad credentials |
| POST | `/auth/refresh` | – | `refreshToken` | `{ accessToken }` |
| POST | `/auth/logout` | – | `refreshToken` | `204` |

### Current user: `/me`

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/me` | ✅ | – | `{ user }` |
| PATCH | `/me` | ✅ | `name?`, `email?` (at least one; `null` or `""` clears email) | `{ user }` |
| DELETE | `/me` | ✅ | – | `204`. Cascades to sessions, messages, the Photon line, and all bank data |
| POST | `/me/welcome` | – | – | **stub** (no response sent) |

User responses never include `passwordHash`. Services only select public columns.

### Bank / Plaid (mounted at root)

All bank routes now require auth and are scoped to `req.userId`. Routes that need a linked bank return `400 "No bank connected. Connect a bank first."` if the user has none.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/plaid/link-token` | ✅ | Creates a Plaid Link token with the user's id as `client_user_id`. Returns `{ link_token }` |
| POST | `/plaid/exchange` | ✅ | Body `{ public_token }`. Saves the bank connection, then pulls its accounts and transactions. Returns `{ success: true, item_id }` (our `PlaidItem.id`) |
| GET | `/plaid/items` | ✅ | `{ items: [{ id, institutionName, status, createdAt }] }` |
| DELETE | `/plaid/items/:id` | ✅ | Calls Plaid `itemRemove`, then deletes the item and its accounts and transactions. `204`, or `404` if it isn't the user's |
| GET | `/accounts` | ✅ | Fetches accounts live from Plaid for every linked bank, saves the balances, and returns `{ accounts }` |
| GET | `/accounts/:id/balance` | ✅ | `:id` is Plaid's `account_id` (as returned by `/accounts`). Fetches a fresh balance, saves it, returns `{ balance: { account_id, available, current, iso_currency_code } }` |
| GET | `/transactions` | ✅ | Syncs with Plaid first, then reads up to 100 transactions from the last 30 days out of the database, newest first. Returns `{ transactions, total_transactions }` |
| GET | `/transactions/summary` | – | **stub** |

The response shapes of `/accounts` and `/transactions` match what the old in-memory Sandbox version returned, so the frontend didn't need to change. For transactions read from the database, `name` and `merchant_name` are the same value, `category` is always `null`, and `personal_finance_category` only has `primary`.

### Offers: `/offers`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/offers` | – | Every offer, sorted by name. Returns `{ offers, total }`. The old `q` / `limit` / `offset` parameters are no longer read |
| GET | `/offers/:id` | – | One offer, or `404` |
| POST | `/offers/sync` | – | Re-pulls offers from studentoffers.co and returns `{ synced }` |

### Agent and webhooks

| Method | Path | Description |
| --- | --- | --- |
| POST | `/agent/connect` | **stub**. Meant for linking a user to a Photon line |
| POST | `/webhooks/plaid` | **stub** |
| POST | `/webhooks/spectrum` | **stub** |

---

## Bank data (Plaid)

All Plaid logic lives in `services/Plaid.js`. The router only calls service functions.

**Linking a bank (`connectBank`):**

1. Exchange the `public_token` for an access token and Plaid `item_id`.
2. Look up the institution name with `itemGet`.
3. Upsert a `PlaidItem` (matched on `plaidItemId`) with the encrypted access token and `status: active`.
4. Save accounts from `accountsGet`.
5. Run a first transaction sync.

**Token encryption:** access tokens are encrypted with AES-256-GCM before they're stored. The key is the SHA-256 of `PLAID_TOKEN_SECRET`, and each token gets a random 12-byte IV. The stored value is `iv.tag.ciphertext`, each part base64. Tokens are only decrypted inside `callPlaid` right before a Plaid request.

**Expired logins:** `callPlaid` wraps every Plaid call that uses a saved token. If Plaid returns `ITEM_LOGIN_REQUIRED`, the item's status is set to `needsReauth` and the error is re-thrown.

**Transaction sync (`syncTransactions`):** uses Plaid's `/transactions/sync` with the item's saved `syncCursor`, looping while `has_more` is true. For each page it:

- upserts the returned accounts and their balances,
- upserts `added` and `modified` transactions (matched on `plaidTransactionId`; `merchantName` falls back to Plaid's `name`, and `category` is `personal_finance_category.primary`),
- deletes `removed` transactions.

When it's done it saves the new cursor, so the next sync only pulls changes. `syncUserTransactions(userId)` runs this for every bank a user has linked and does nothing if they have none.

Syncs happen when a bank is linked, on every `GET /transactions`, and once an hour from the offers job.

---

## iMessage assistant (Photon + Gemini)

The assistant doesn't go through an HTTP route. `startListening()` in `services/photon.js` runs at startup and loops over incoming messages from Spectrum.

```
User texts their Photon number
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
message_orchestrator.js: handleMessage(text)
        ├─ 1. gemini.parseMessage: structured-output call that pulls { name, product, price }
        │                          (a parse failure doesn't block the reply)
        ├─ 2. No store/company name found → askGemini(text, parsed, []) answers the text normally
        ├─ 3. Offers.returnOffers(name): look up matching offers
        │      └─ none found → reply "Sorry, I was unable to generate any offers."
        └─ 4. gemini.askGemini(text, parsed, offers): short plain-text reply describing the offers
        │
        ▼
space.send(reply) → logMessage(phone, reply, "outbound")
```

Notes:

- The orchestration used to be `handleMessage` in `gemini.js`. That version is now commented out; `photon.js` imports `handleMessage` from `message_orchestrator.js`.
- `askGemini` puts the matched offers into the system prompt. If an offer doesn't say where to redeem it, Gemini is told to send the user to that company's website. The `parsed` argument is no longer used in the prompt.
- `space.responding(...)` shows the typing indicator while Gemini works.
- One Spectrum connection is shared across the process (`getApp()` caches it).
- `sendText(phone, text)` can start a new conversation from the server side. It now logs each step (`getApp`, `space.create`, `space.send`) and re-throws on failure.
- Texts from numbers that don't have an account are not logged.

---

## Student offers

`services/Offers.js` fetches `https://www.studentoffers.co/api/offers`, drops entries missing `id`, `name`, or `offer`, and upserts the rest into the `Offer` table, matched on `externalId`, inside one transaction. It is safe to re-run. Each offer now gets a `category`, but `getCategory` is a placeholder that always returns `"N/A"`.

You can trigger the sync three ways:

- `npm run sync:offers`, which runs `Scripts/syncOffers.js` and disconnects Prisma when done
- `POST /offers/sync`
- The hourly offers job (below)

### Matching offers to a name (`returnOffers`)

`returnOffers(name)` is used by both the iMessage assistant and the offers job. It runs a raw MySQL query that returns up to 20 offers where either:

- the offer name contains the search text (`LIKE %name%`), or
- the offer name sounds like it (`SOUNDEX`), which catches typos like "spotfy".

Results are ordered exact match first, then substring matches, then sound-alike matches, then by name. An empty name returns no offers.

### Hourly offers job

`startOffersJob()` is called from `index.js`. It runs `runOffersJob()` once at startup and then every hour with `setInterval`. Each run (`findOffersForUsers`):

1. Re-syncs the offer catalog. If that fails, it keeps going with the saved offers.
2. Finds every user with at least one linked bank.
3. For each user, syncs their transactions. If that fails, it uses the transactions already saved.
4. Collects the distinct merchant names on transactions **saved** in the last hour (by `Transaction.createdAt`, not the transaction date).
5. Runs `returnOffers` for each merchant and keeps the ones with matches.

Right now `runOffersJob` only logs `Offers for <userId> at <merchant>: [...]`. Texting these matches to the user is not wired up yet.

The job runs in-process, so it only runs while the server is up, and it would run once per process if the server were ever scaled to more than one instance.

---

## Data model

Defined in `prisma/schema.prisma`. Every user-owned table uses `onDelete: Cascade`, so deleting a user removes all of their data, including bank connections, accounts, and transactions. IDs are UUID strings stored as `CHAR(36)`.

| Model | Purpose | Key fields |
| --- | --- | --- |
| `User` | An account | `phone` (unique, E.164), `name`, `email?`, `passwordHash`, `agentOptOut` |
| `Session` | One per logged-in device | `refreshTokenHash` (unique), `expiresAt`, `revokedAt?` |
| `PlaidItem` | One per bank connection | `userId`, `plaidItemId` (unique), `accessTokenEncrypted`, `institutionName?`, `syncCursor?`, `status` (`active` / `needsReauth`) |
| `Account` | A bank account under a `PlaidItem` | `itemId`, `plaidAccountId` (unique), `name`, `currentBalance?`, `availableBalance?`, `balanceFetchedAt?` |
| `Transaction` | A bank transaction | `accountId`, `plaidTransactionId` (unique), `amount`, `date`, `merchantName?`, `category?`, `pending`, `createdAt` (when we saved it) |
| `PhotonLine` | Links a user to their iMessage space | `userId` (unique), `photonPhone`, `spaceId` |
| `MessageLog` | Every inbound/outbound assistant text | `userId`, `direction`, `text`, `createdAt` |
| `Offer` | Student discount catalog | `externalId` (unique), `name`, `offer`, `category`, `description` |

Ownership chain for bank data: `User → PlaidItem → Account → Transaction`. Service queries scope by user through that chain (for example `account: { item: { userId } }`).

The `PhoneCode` model and its `PhoneCodePurpose` enum have been removed from the schema.

Prisma error codes the services handle:

- `P2002` (unique constraint) on signup → `409`
- `P2025` (record not found) on update/delete → `404`

---

## Status and known gaps

**Working**
- Signup (with Photon user creation), login, refresh, logout, and per-device sessions
- `GET`/`PATCH`/`DELETE /me`
- iMessage assistant end-to-end (receive → parse → offer lookup → reply → log)
- Plaid Sandbox, saved per user: link token, exchange, item list/remove, accounts, per-account balance, transactions via `/transactions/sync`
- Encrypted Plaid access tokens and `needsReauth` tracking
- Student offer sync, listing, and fuzzy name matching
- Hourly offers job (sync + match, logging only)
- Test user seed script

**In progress / not yet built**
- Sending the offers job's matches to users over iMessage
- `GET /transactions/summary`
- Offer categories (`getCategory` always returns `"N/A"`) and filtering `GET /offers` by category
- `/agent/connect`, `/me/welcome`, and both webhook endpoints (a Plaid webhook would let syncs happen on demand instead of hourly)
- A re-link flow for items marked `needsReauth`
- Phone verification (the `PhoneCode` model is gone; `validatePhoneCode` is still in `validators/Auth.js` but nothing uses it)

**Issues to fix**
- **Signup can lock a user out.** The `User` row is created before `addPhotonUser` runs. If Photon fails, signup returns `409`, but the user already exists, so retrying returns `409 "An account with this phone number already exists"` and no session was created. The user creation and Photon call need to be ordered or rolled back together.
- `services/Auth.js` still imports `sendWelcomeMessage` but no longer calls it, so no welcome text is sent on signup.
- `GET /offers` returns the whole table with no search or paging, and doesn't select the new `category` field.
- In the assistant, if the parser finds a store name but there are no matching offers, the user gets a fixed "Sorry, I was unable to generate any offers." instead of a normal Gemini reply.
- `message_orchestrator.js` passes `product` and `price` to `returnOffers`, which only reads `name`.
- `sendText` has debug `console.log` lines that should be removed or trimmed.
- `POST /offers/sync` has no `requireAuth`, so anyone can trigger a sync.
- `removeItem` calls Plaid before deleting locally. If Plaid's `itemRemove` fails, the item stays in the database.
- `returnOffers` uses MySQL-specific SQL (`SOUNDEX`, `CONCAT`, `TRIM(TRAILING …)`), so it ties the app to MySQL/MariaDB.
- `.env.example` doesn't list `PLAID_ENV`.
- There's still no `prisma/migrations` folder. The schema has to be applied with `prisma db push` or a first `migrate dev`. (The new `/migrations` rule in `.gitignore` only matches a folder at the repo root, not `backend/prisma/migrations`.)
