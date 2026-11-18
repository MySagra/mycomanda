'use client';

import { useSyncExternalStore } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export interface UseAuthResult {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// The parsed user is cached per raw cookie value: useSyncExternalStore needs a
// stable snapshot, and JSON.parse returns a new object every time.
let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;

function readUserCookie(): AuthUser | null {
  const raw = document.cookie.match(/(?:^|;\s*)mycomanda_user=([^;]*)/)?.[1] ?? null;
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  try {
    cachedUser = raw ? (JSON.parse(decodeURIComponent(raw)) as AuthUser) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

// The cookie is only set by login and cleared by logout, both followed by a navigation.
const subscribe = () => () => {};

export function useAuth(): UseAuthResult {
  // undefined on the server and during hydration: the cookie is not readable yet.
  const user = useSyncExternalStore<AuthUser | null | undefined>(subscribe, readUserCookie, () => undefined);

  return {
    user: user ?? null,
    isLoading: user === undefined,
    isAuthenticated: !!user,
  };
}
