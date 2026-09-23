import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getAuthToken } from '@/lib/auth';

interface DetailItem {
  id: string;
  quantity: number;
  notes: string | null;
  total: string;
  unitPrice: string;
  unitSurcharge: string;
  food: { id: string; name: string; printerId: string | null };
}

interface OrderDetail {
  id: string;
  categorizedItems?: { items: DetailItem[] }[];
  [key: string]: unknown;
}

/**
 * One order in the shape of the SSE `confirmed-order` payload. The backend
 * groups the items by food category; the monitor wants a flat `orderItems`.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const res = await fetch(`${process.env.API_URL}/v1/orders/${encodeURIComponent(id)}`, {
    headers: { Cookie: `${AUTH_COOKIE_NAME}=${token}` },
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as OrderDetail;
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const { categorizedItems = [], ...order } = data;
  const orderItems = categorizedItems.flatMap((group) =>
    group.items.map((it) => ({
      ...it,
      foodId: it.food.id,
      food: { id: it.food.id, name: it.food.name, printerId: it.food.printerId },
    })),
  );
  return NextResponse.json({ ...order, orderItems });
}

// COMPLETED closes an order; CONFIRMED sends a completed order back to the kitchen.
const ALLOWED_STATUSES = new Set(['COMPLETED', 'CONFIRMED']);

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
