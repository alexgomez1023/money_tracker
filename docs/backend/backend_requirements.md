# Backend Requirements

Alex Gomez

## Overview

The backend is a Node.js (TypeScript) service that manages users, links bank accounts through Plaid, syncs transactions and balances, and lets users talk to the agent over iMessage through Photon.

- **API server:** Node.js with Express or Hono, Prisma ORM
- **Database:** MySQL
- **Bank data:** Plaid (Link, Balance, Transactions) API
- **Messaging:** Photon Spectrum (spectrum-ts SDK + webhooks)
- **Client:** the mobile app, which talks only to our API.

## User accounts and auth

Users sign up with a phone number and password and get short-lived tokens for the app

1. **Sign up:** name, phone number, optional email, password
2. **Passwords:** hash with bcrypt, minimum 8 characters
3. **Login:** returns a short-lived access token (JWT, about 15 minutes) and a refresh token. Store refresh tokens hashed so they can be revoked.
4. **Logout:** revokes the refresh token
5. **Profile:** user can view and update name and email. Changing the phone number requires re-verification.
6. **Delete account:** removes the Plaid connection and all user data.

## Bank linking and balances

Users connect their bank through Plaid Link, The backend holds the Plaid access token and never stores raw account numbers

1. **Link:** backend creates a Plaid `link_token`, the app opens Plaid Link, then the backend exchanges the returned `public_token` for an `access_token`.
2. **Token storage:** encrypt the `access_token` at rest (AES-256-GCM, key from env or a key manager). It never leaves the backend.
3. **Accounts:** store Plaid `account_id`, display name, type and subtype, and the mask (last 4 digits). No full account or routing numbers.
4. **Balances:** fetch current and available balance from Plaid on request, and cache them with a `fetchedAt` timestamp.
5. **Re-auth:** when Plaid reports the login expired, mark the connection as needing re-auth and prompt the user to relink.
6. **Unlink:** remove the Plaid item and delete its accounts and transactions.

## Transactions

Transactions sync from Plaid into our database, so the app and agent read from our DB instead of calling Plaid every time.

1. **Sync:** use Plaid's transactions sync endpoint with a saved cursor per bank connection. Apply added, modified, and removed transactions
2. **When to sync:** right after linking, whenever Plaid sends an "updates available" webhook, and once a day as a fallback
3. **Stored fields:** amount, date, merchant name, category, pending flag, account.
4. **List endpoint:** filter by date range, account, and category
5. **Summary endpoint:** total spend by category and by month for a date range

## Agent messaging via Photon

Users get texted by the agent over iMessage, and the agent answers questions about their money/get using only that user's data.

1. **Connect:** after phone verification (If we get to it), the backend creates a Spectrum conversation with the user's number, sends an intro message, and saves which Photon line it used.
2. **Inbound:** Spectrum POSTs each message to our webhook. Verify the signature, reject requests older than 5 minutes, and skip duplicates by webhook id.
3. **Match the sender:** look up the user by phone number. Unknown numbers get a sign-up link and nothing else.
4. **Agent tools (v1, read only):** get balances, list recent transactions, spend summary by category or month.
5. **Reply:** send through the spectrum-ts SDK in the same Node process.
6. **Opt out:** a "STOP" message turns off agent messages for that user.

## Data model

| Table | Key fields                                                  | Notes |
| ----- | ----------------------------------------------------------- | ----- |
| User  | id, name, phone (unique), email, passwordHash, agentOptOut, |

## API endpoints

All endpoints except signup, login, and webhooks require a valid access token, and every query is scoped to that user.

| Method | Path                  | Purpose                                     |
| ------ | --------------------- | ------------------------------------------- |
| POST   | /auth/signup          | Create account, send phone code             |
| POST   | /auth/login           | Return access and refresh tokens            |
| POST   | /auth/refresh         | Swap a refresh token for a new access token |
| POST   | /auth/logout          | Revoke the refresh token                    |
| GET    | /me                   | Get profile                                 |
| PATCH  | /me                   | Update profile                              |
| DELETE | /me                   | Delete account and all data                 |
| POST   | /plaid/link-token     | Start Plaid Link                            |
| POST   | /plaid/exchange       | Save a new bank connection                  |
| DELETE | /plaid/items/:id      | Unlink a bank                               |
| GET    | /accounts             | List accounts with cached balances          |
| GET    | /accounts/:id/balance | Fetch a fresh balance                       |
| GET    | /transactions         | List with filters and pagination            |
| GET    | /transactions/summary | Spend by category or month                  |
| POST   | /agent/connect        | Start the iMessage conversation             |
| POST   | /webhooks/plaid       | Plaid events (sync, re-auth)                |
| POST   | /webhooks/spectrum    | Inbound agent messages                      |
