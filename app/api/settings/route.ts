import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import { fetchSagraSettings } from '@/lib/settings/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const settings = await fetchSagraSettings(token);
  if (!settings) {
    return NextResponse.json({ message: 'Settings fetch failed' }, { status: 502 });
  }
  return NextResponse.json(settings);
}
