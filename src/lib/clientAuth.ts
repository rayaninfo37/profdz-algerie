/**
 * Client-Side Auth Request Deduplication & Reactive State
 *
 * Prevents multiple simultaneous requests to /api/auth/me from
 * Navbar, Sidebar, and PersistentProfileAnchor, and emits reactive
 * change events so that login/logout/profile updates reflect
 * INSTANTLY across the UI without requiring Ctrl+R.
 */

let authPromise: Promise<any> | null = null;
let cachedAuth: { authenticated: boolean; user: any } | null = null;

const AUTH_CHANGE_EVENT = 'kryty-auth-change';

export async function getClientAuth(forceRefresh = false): Promise<{ authenticated: boolean; user: any }> {
  if (!forceRefresh && cachedAuth !== null) {
    return cachedAuth;
  }
  if (!forceRefresh && authPromise) {
    return authPromise;
  }

  authPromise = fetch('/api/auth/me')
    .then((res) => {
      if (!res.ok) throw new Error('Auth network failed');
      return res.json();
    })
    .then((data) => {
      cachedAuth = data;
      authPromise = null;
      return data;
    })
    .catch(() => {
      authPromise = null;
      return { authenticated: false, user: null };
    });

  return authPromise;
}

/**
 * Manually set the client auth state (e.g. immediately after successful login or profile patch)
 * and broadcast the event to all UI listeners in the tab.
 */
export function setClientAuth(user: any): void {
  cachedAuth = { authenticated: !!user, user };
  authPromise = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: cachedAuth }));
  }
}

/**
 * Clear the client auth cache (e.g. on logout) and broadcast the event to all UI listeners.
 */
export function clearClientAuthCache(): void {
  cachedAuth = { authenticated: false, user: null };
  authPromise = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: cachedAuth }));
  }
}

/**
 * Subscribe to reactive auth changes in the browser.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToAuthChange(callback: (auth: { authenticated: boolean; user: any }) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail) {
      callback(custom.detail);
    }
  };

  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handler);
  };
}
