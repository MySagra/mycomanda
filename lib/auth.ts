import { cookies } from 'next/headers';

export const COOKIE_STORE_NAME = 'mycomanda_session';
export const AUTH_COOKIE_NAME = 'mysagra_session';
export const USER_COOKIE_NAME = 'mycomanda_user';

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_STORE_NAME)?.value ?? null;
}
