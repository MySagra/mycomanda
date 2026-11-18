import { AUTH_COOKIE_NAME } from '@/lib/auth';
import type { SagraSettings } from './types';

/** GET /v1/settings on the backend. Null when it fails, so callers fall back to defaults. */
export async function fetchSagraSettings(token: string): Promise<SagraSettings | null> {
  try {
    const res = await fetch(`${process.env.API_URL}/v1/settings`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`[settings] upstream status ${res.status}`);
      return null;
    }
    return (await res.json()) as SagraSettings;
  } catch (err) {
    console.error('[settings] upstream fetch failed:', err);
    return null;
  }
}
