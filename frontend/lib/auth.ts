
import { useMemo, useSyncExternalStore } from "react";

const SESSION_KEY = "money-tracker-session";
const SESSION_EVENT = "session-updated";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

export type Session = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  // The number the user texts to reach their agent. Only returned at signup.
  agentPhone: string | null;
};

export type FieldErrors = Record<string, string>;

// Carries the backend's error message and its per-field messages.
export class AuthError extends Error {
  fields: FieldErrors;

  constructor(message: string, fields: FieldErrors = {}) {
    super(message);
    this.fields = fields;
  }
}

function readRawSession() {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem(SESSION_KEY);
}

function parseSession(raw: string | null): Session | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function getSession() {
  return parseSession(readRawSession());
}

function saveSession(session: Session | null) {
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }

  window.dispatchEvent(new Event(SESSION_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SESSION_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}

// The signed-in session, or null. Updates when the user logs in or out.
export function useSession() {
  const raw = useSyncExternalStore(
    subscribe,
    readRawSession,
    () => null
  );

  return useMemo(() => parseSession(raw), [raw]);
}

async function postAuth(path: string, body: unknown) {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new AuthError(
      data.error ?? "Something went wrong. Try again.",
      data.fields ?? {}
    );
  }

  return response;
}

export async function signup(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
}) {
  const response = await postAuth("signup", input);
  const data = await response.json();

  const session: Session = {
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    agentPhone: data.agentPhone ?? null,
  };

  saveSession(session);

  return session;
}

export async function login(input: {
  phone: string;
  password: string;
}) {
  const response = await postAuth("login", input);
  const data = await response.json();

  const session: Session = {
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    agentPhone: null,
  };

  saveSession(session);

  return session;
}

export async function logout() {
  const session = getSession();

  saveSession(null);

  if (!session) return;

  // The session is already cleared here, so a failed request changes nothing.
  await postAuth("logout", {
    refreshToken: session.refreshToken,
  }).catch(() => {});
}

async function failedRequest(response: Response) {
  const data = await response.json().catch(() => ({}));

  return new AuthError(
    data.error ?? "Something went wrong. Try again.",
    data.fields ?? {}
  );
}

// Saves the user's name and email, and updates the stored session to match.
export async function updateProfile(input: {
  name: string;
  email: string;
}) {
  const response = await authFetch("/api/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await failedRequest(response);
  }

  const data = await response.json();
  const session = getSession();

  if (session) {
    saveSession({
      ...session,
      user: { ...session.user, ...data.user },
    });
  }
}

// Permanently deletes the account and everything linked to it, then signs out.
export async function deleteAccount() {
  const response = await authFetch("/api/me", {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await failedRequest(response);
  }

  saveSession(null);
}

// Swaps the refresh token for a new access token. Signs the user out if it is no longer valid.
async function refreshAccessToken(session: Session) {
  try {
    const response = await postAuth("refresh", {
      refreshToken: session.refreshToken,
    });

    const data = await response.json();

    saveSession({ ...session, accessToken: data.accessToken });

    return data.accessToken as string;
  } catch {
    saveSession(null);

    return null;
  }
}

function withToken(options: RequestInit, accessToken: string) {
  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

// fetch() with the access token attached. Retries once with a new token if the old one expired.
export async function authFetch(
  url: string,
  options: RequestInit = {}
) {
  const session = getSession();

  if (!session) {
    return fetch(url, options);
  }

  const response = await fetch(
    url,
    withToken(options, session.accessToken)
  );

  if (response.status !== 401) {
    return response;
  }

  const accessToken = await refreshAccessToken(session);

  if (!accessToken) {
    return response;
  }

  return fetch(url, withToken(options, accessToken));
}
