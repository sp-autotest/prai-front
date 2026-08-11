import type { LoginResponse, LoginUser } from "@/types/auth";

/** localStorage key used for the browser auth session. */
export const AUTH_STORAGE_KEY = "prai.auth.session";

/** Browser event name dispatched when the auth session is saved or cleared. */
export const AUTH_SESSION_CHANGED_EVENT = "prai:auth-session-changed";

export type AuthSession = {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  user: LoginUser;
};

/**
 * Notifies same-tab listeners that the auth session changed.
 * Complements the cross-tab `storage` event (which does not fire in the same tab).
 * @returns {void}
 * @sideeffect Dispatches `AUTH_SESSION_CHANGED_EVENT` on `window`.
 */
const notifyAuthSessionChanged = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
};

/**
 * Persists a login response as a browser session (localStorage).
 * @param {LoginResponse} response - Successful login payload from the API.
 * @returns {AuthSession} Normalized session object that was stored.
 * @sideeffect Writes to `localStorage` and notifies auth listeners.
 */
export const saveAuthSession = (response: LoginResponse): AuthSession => {
  const session: AuthSession = {
    accessToken: response.access_token,
    tokenType: response.token_type,
    expiresAt: Date.now() + response.expires_in * 1000,
    user: response.user,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    notifyAuthSessionChanged();
  }

  return session;
};

/**
 * Reads the stored auth session, if any and not expired.
 * @returns {AuthSession | null} Session or `null` when missing/expired/invalid.
 */
export const getAuthSession = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;

    if (!session.accessToken || !session.user?.email) {
      return null;
    }

    if (typeof session.expiresAt === "number" && session.expiresAt <= Date.now()) {
      clearAuthSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
};

/**
 * Clears the stored auth session.
 * @sideeffect Removes the session key from `localStorage` and notifies auth listeners.
 * @returns {void}
 */
export const clearAuthSession = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthSessionChanged();
};

/**
 * Updates the cached user fields inside the stored auth session.
 * @param {Pick<LoginUser, "email" | "nickname"> & { id?: number }} user - Updated user fields.
 * @returns {AuthSession | null} Updated session or null when no session exists.
 * @sideeffect Writes to `localStorage` when a session is present.
 */
export const updateAuthSessionUser = (
  user: Pick<LoginUser, "email" | "nickname"> & { id?: number },
): AuthSession | null => {
  const current = getAuthSession();

  if (!current) {
    return null;
  }

  const next: AuthSession = {
    ...current,
    user: {
      ...current.user,
      ...user,
      id: user.id ?? current.user.id,
    },
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
    notifyAuthSessionChanged();
  }

  return next;
};
