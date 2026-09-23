import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getAuthToken } from '@/lib/auth';

const ALLOWED_STATUSES = new Set(['COMPLETED']);

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  if (!body?.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
  }

  const res = await fetch(`${process.env.API_URL}/v1/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Cookie: `${AUTH_COOKIE_NAME}=${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: body.status }),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
