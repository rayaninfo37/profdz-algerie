/**
 * Client-Side Auth Request Deduplication & In-Memory Cache
 *
 * Prevents multiple simultaneous requests to /api/auth/me from
 * Navbar, Sidebar, and PersistentProfileAnchor.
 */

let authPromise: Promise<any> | null = null;
let cachedAuth: any = null;

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

export function clearClientAuthCache(): void {
  cachedAuth = null;
  authPromise = null;
}
