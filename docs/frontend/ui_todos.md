# Frontend UI/UX todos

Open items from the UI/UX review of the frontend. Finished work is listed at the bottom so the numbering matches the original review.

## 3. Navigation

- [ ] On phones, Savings, Connect Bank and Settings are still not in the tab bar; they are reached from the dashboard and the profile icon. The desktop sidebar lists all three.
- [ ] Dashboard "Connect your bank" card (`app/page.tsx`) always shows. Once a bank is linked, show the connection status and a "Manage" link.
- [ ] Pages keep the bottom padding that clears the tab bar (`pb-32`) on desktop, where there is no tab bar.
- [ ] The nav items still live in `lib/mock-data.ts`. Move them next to `components/layout/AppShell.tsx`.

## 4. Errors and feedback (remaining)

- [ ] The Retry button on the dashboard cards reloads the whole page. Only the Connect Bank sections re-fetch in place. Give each card its own reload.
- [ ] Login and signup still show server errors inside the form, not as a toast.
- [ ] Toasts have no close button; they disappear after four seconds.

## 5. Typography (remaining)

- [ ] Outfit has no tabular figures, so headline numbers can shift width as they change. Rows of amounts still use Geist with tabular figures.
- [ ] Satoshi and Cabinet Grotesk were not tried because they are not on Google Fonts and would need font files added to the repo.

## 6. Lists and data

- [ ] Every transaction row uses the same wallet icon. Map categories to icons, or show merchant initials.
- [ ] Deals paging is done in the browser: all ~600 offers are still downloaded, then shown 12 at a time. Move paging to the backend (`GET /offers` with a page and size).
- [ ] A deal card has no link to redeem the offer. The backend does not store a URL yet.
- [ ] Deal category colours (`categoryColors` in `app/deals/page.tsx`) include a purple and a green that are not in the palette, and the category "icon" is its first letter.
- [ ] `/api/insights` is requested twice in development (React Strict Mode double mount). Route it through the shared request helper in `lib/bank-data.ts`.

## 7. Consistency and polish

- [ ] The auth fields (`components/auth/TextField.tsx`, `PhoneField.tsx`, `CountryCodeSelect.tsx`) keep their own input styles because they carry error states. Build them on `components/ui/Input.tsx`.
- [ ] The buttons inside `components/ui/BankErrorNotice.tsx` and the text-only links ("Clear filters", "View all") are not `Button` components.
- [ ] Chart colours in `lib/budget-storage.ts` are still hex values.
- [ ] No dark mode. Decide whether the app needs one before adding tokens for it.
- [ ] Savings goals are saved in the browser, while budgets are saved to the account. Move goals to the backend so they follow the user across devices. Saved deals have the same limitation.
- [ ] Five older `react-hooks/set-state-in-effect` lint errors remain: `app/savings/page.tsx`, `components/dashboard/PersonalizedOffers.tsx`, `components/plaid/BankAccounts.tsx`, `components/plaid/BankTransactions.tsx`, `components/plaid/ConnectBankButton.tsx`.

## Done

### 3. Navigation

- [x] Desktop (1024px and wider) has a left sidebar with every page; phones and tablets keep the bottom tab bar (`components/layout/AppShell.tsx`).
- [x] The current page is marked: a filled icon and bold label on the tab bar, a bar and tinted row in the sidebar.
- [x] The dashboard Connect Bank card is cut down to a title, one line and the button.

### 7. Consistency and polish

- [x] Shared `Button`, `Input` and `Chip` components in `components/ui/`, used on every page.
- [x] One corner rule: cards `2xl`, buttons and inputs `xl`, pills `full`.
- [x] Typed arrows replaced with the arrow icon; the dashboard Connect Bank card and budget status colours use tokens (new `--warning`).
- [x] Buttons have a pressed state, and the global transition no longer animates every property.
- [x] The "—" placeholder for unavailable values is now "N/A".

### 1. Visible bugs

- [x] Removed the debug heading on Transactions ("Activity — Search: … — Category: …").
- [x] Assistant replies no longer show raw markdown; the model is told to answer in plain text.
- [x] Removed "Plaid Sandbox" from user-facing copy.
- [x] Saved deals are kept in the browser and survive a reload (`lib/deal-storage.ts`).
- [x] Added the page title and description in `app/layout.tsx`.

### 2. Connect Bank page

- [x] Rebuilt on the shared page header, `Card` and colour tokens.
- [x] Dropped the "BankChecks to BankTexts" name; the app is "Money Tracker" everywhere.

### 4. Errors and feedback

- [x] Budgets and Savings no longer use browser pop-ups; errors show under the field and delete is confirmed inline.
- [x] Bank data failures are split into signed out, no bank and server unreachable, each with its own button (`components/ui/BankErrorNotice.tsx`).
- [x] Personalized Offers shows skeleton cards while loading.
- [x] Actions report success and failure as toasts (`lib/toast.ts`, `components/ui/Toaster.tsx`): budgets, savings goals, saved offers, bank connect and disconnect, profile, delete account, copy number.
- [x] Personalized Offers and Deals have a Retry button when loading fails.

### 6. Lists and data

- [x] Transactions are grouped by day, with "Pending" as a tag.
- [x] Deals shows 12 offers per page with Previous and Next.

### 5. Typography

- [x] Geist loaded through `next/font`, with tabular numerals.
- [x] Page titles and the main number on summary cards are larger.
- [x] Headings and headline numbers use Outfit; body text stays in Geist.
- [x] Every card title is the same size, and each card has one prominent number or title.
- [x] Money, dates and categories go through `lib/format.ts` ("$1,234.50", "Oct 3", "Food & Drink"), including other currencies on the accounts list.
