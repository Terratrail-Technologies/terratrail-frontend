/**
 * useCurrentUser — fetches the authenticated user from /auth/me/ once per
 * session and caches the result in localStorage under "tt_user".
 *
 * Also exposes the workspace name from "tt_workspace_slug".
 */
import { useState, useEffect } from "react";
import { api, type User } from "../services/api";

function getCachedUser(): User | null {
  try {
    const s = localStorage.getItem("tt_user");
    if (!s || s === "undefined" || s === "null") return null;
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function cacheUser(user: User) {
  localStorage.setItem("tt_user", JSON.stringify(user));
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(getCachedUser);
  const [loading, setLoading] = useState(!getCachedUser());

  useEffect(() => {
    const tokens = localStorage.getItem("tt_auth");
    if (!tokens) { setLoading(false); return; }

    api.auth.me()
      .then((u) => {
        // Only update if the API returned a valid user object.
        // If the user was deleted server-side, the response may be null/empty —
        // in that case keep the cached value so the UI degrades gracefully
        // instead of redirecting to login.
        if (u && typeof u === "object" && (u as any).id) {
          cacheUser(u);
          setUser(u);
        }
      })
      .catch(() => { /* network/auth error — keep cached value, do NOT redirect */ })
      .finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    try {
      const u = await api.auth.me();
      cacheUser(u);
      setUser(u);
      return u;
    } catch {
      return null;
    }
  };

  const workspaceSlug = localStorage.getItem("tt_workspace_slug") ?? "";

  /** Display name — falls back gracefully. */
  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
    : "User";

  /** Two-letter initials for avatar. */
  const initials = user
    ? ((user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "")).toUpperCase() ||
      user.email.substring(0, 2).toUpperCase()
    : "AU";

  return { user, loading, refresh, displayName, initials, workspaceSlug };
}
