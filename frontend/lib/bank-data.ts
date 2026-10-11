
// How long a response is reused before the next caller triggers a new request.
const SHARE_MS = 30 * 1000;

type SharedRequest = {
  promise: Promise<unknown>;
  startedAt: number;
};

const requests: Record<string, SharedRequest> = {};

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request to ${url} failed`);
  }

  return response.json();
}

// Every component that asks for the same URL shares one request,
// so a page with several bank widgets only hits the backend once.
function getShared<T>(url: string, fresh: boolean): Promise<T> {
  const existing = requests[url];

  if (
    !fresh &&
    existing &&
    Date.now() - existing.startedAt < SHARE_MS
  ) {
    return existing.promise as Promise<T>;
  }

  const promise = fetchJson(url);

  requests[url] = { promise, startedAt: Date.now() };

  // Failed requests are not reused, so the next caller tries again.
  promise.catch(() => {
    if (requests[url]?.promise === promise) {
      delete requests[url];
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
  for (const url of Object.keys(requests)) {
    delete requests[url];
  }
}
