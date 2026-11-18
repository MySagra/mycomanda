import { connection } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import { SettingsProvider } from '@/lib/settings/SettingsContext';
import { fetchSagraSettings } from '@/lib/settings/server';

/**
 * Loads the sagra settings at request time, so the first render already shows
 * the right labels and times. Without a session (login page) there is nothing
 * to load: the client fetches them once logged in.
 */
export async function SettingsProviderWrapper({ children }: { children: React.ReactNode }) {
  await connection();
  const token = await getAuthToken();
  const initial = token ? await fetchSagraSettings(token) : null;

  return <SettingsProvider initial={initial}>{children}</SettingsProvider>;
}
