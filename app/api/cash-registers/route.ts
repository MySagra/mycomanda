import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getAuthToken } from '@/lib/auth';

export async function GET() {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${process.env.API_URL}/v1/cash-registers?enabled=true`, {
    method: 'GET',
    headers: {
      Cookie: `${AUTH_COOKIE_NAME}=${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
