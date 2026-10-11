
import { authFetch, getSession } from "@/lib/auth";

// How long a response is reused before the next caller triggers a new request.
const SHARE_MS = 30 * 1000;

type SharedRequest = {
  promise: Promise<unknown>;
  startedAt: number;
};

const requests: Record<string, SharedRequest> = {};

// Why bank data could not be loaded. Each one gets its own message and button.
export type BankErrorReason = "signedOut" | "noBank" | "unavailable";

export class BankDataError extends Error {
  reason: BankErrorReason;

  constructor(reason: BankErrorReason) {
    super(`Bank data could not be loaded: ${reason}`);

    this.reason = reason;
  }
}

// The backend answers 401 when signed out and 400 when no bank is linked.
export function getStatusReason(status: number): BankErrorReason {
  if (status === 401) {
    return "signedOut";
  }

  if (status === 400) {
    return "noBank";
  }

  return "unavailable";
}

export function getBankErrorReason(error: unknown): BankErrorReason {
  if (error instanceof BankDataError) {
    return error.reason;
  }

  return "unavailable";
}

async function fetchJson(url: string) {
  let response: Response;

  try {
    response = await authFetch(url, { cache: "no-store" });
  } catch {
    throw new BankDataError("unavailable");
  }

  if (!response.ok) {
    throw new BankDataError(getStatusReason(response.status));
  }

  return response.json();
}

// Every component that asks for the same URL shares one request,
// so a page with several bank widgets only hits the backend once.
function getShared<T>(url: string, fresh: boolean): Promise<T> {
  // Keyed by user as well, so one account never sees another's response.
  const key = `${getSession()?.user.id ?? "guest"} ${url}`;

  const existing = requests[key];

  if (
    !fresh &&
    existing &&
    Date.now() - existing.startedAt < SHARE_MS
  ) {
    return existing.promise as Promise<T>;
  }

  const promise = fetchJson(url);

  requests[key] = { promise, startedAt: Date.now() };

  // Failed requests are not reused, so the next caller tries again.
  promise.catch(() => {
    if (requests[key]?.promise === promise) {
      delete requests[key];
    }
  });

  return promise as Promise<T>;
}

// Pass fresh = true to skip the shared response, e.g. for a Refresh button.
export function getTransactions<T>(fresh = false) {
  return getShared<{ transactions?: T[] }>("/api/transactions", fresh);
}

export function getAccounts<T>(fresh = false) {
  return getShared<{ accounts?: T[] }>("/api/accounts", fresh);
}

// Call after linking or unlinking a bank so the next read is up to date.
export function clearBankData() {
  for (const key of Object.keys(requests)) {
    delete requests[key];
  }
}
