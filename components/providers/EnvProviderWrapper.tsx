import { connection } from 'next/server';
import { EnvProvider } from '@/lib/contexts/EnvContext';
import { getShowNumbers } from '@/lib/env';

export async function EnvProviderWrapper({ children }: { children: React.ReactNode }) {
  // Read env at request time, not at build time, so the Docker .env applies.
  await connection();
  const showNumbers = getShowNumbers();

  return (
    <EnvProvider showNumbers={showNumbers}>
      {children}
    </EnvProvider>
  );
}
