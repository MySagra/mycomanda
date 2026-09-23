import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Statuses the kitchen can list, each sorted by the moment it was reached.
const SORT_BY_STATUS: Record<string, string> = {
  CONFIRMED: 'confirmedAt',
  COMPLETED: 'completedAt',
};

// Backend caps `limit` at 100.
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

interface Food {
  id: string;
  name: string;
  printerId: string | null;
}

interface OrderItem {
  foodId: string | null;
  [key: string]: unknown;
}

interface Order {
  orderItems?: OrderItem[];
  [key: string]: unknown;
}

interface OrdersPage {
  data: Order[];
  pagination: { totalPages: number };
}

/**
 * Orders of the current service day in one status: CONFIRMED (the default) is
 * fetched before the client opens the SSE channel, COMPLETED feeds the
 * completed orders page. The backend returns order items without the food, so
 * foods are loaded first and joined in to match the SSE `confirmed-order` payload.
 */
export async function GET(req: NextRequest) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const dateFrom = req.nextUrl.searchParams.get('dateFrom');
  const dateTo = req.nextUrl.searchParams.get('dateTo');
  if (!dateFrom || !dateTo) {
    return NextResponse.json({ message: 'dateFrom and dateTo are required' }, { status: 400 });
  }

  const status = req.nextUrl.searchParams.get('status') ?? 'CONFIRMED';
  const sortBy = SORT_BY_STATUS[status];
  if (!sortBy) {
    return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
  }

  const headers = { Cookie: `${AUTH_COOKIE_NAME}=${token}` };

  const foodsRes = await fetch(`${process.env.API_URL}/v1/foods`, { headers, cache: 'no-store' });
  if (!foodsRes.ok) {
    return NextResponse.json({ message: 'Foods fetch failed' }, { status: foodsRes.status });
  }
  const foods = (await foodsRes.json()) as Food[];
  const foodById = new Map(foods.map((f) => [f.id, { id: f.id, name: f.name, printerId: f.printerId }]));

  const orders: Order[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sortBy,
      onlyDiscounted: 'false',
      status,
      dateFrom,
      dateTo,
      include: 'items',
    });
    const res = await fetch(`${process.env.API_URL}/v1/orders?${params}`, { headers, cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ message: 'Orders fetch failed' }, { status: res.status });
    }
    const body = (await res.json()) as OrdersPage;
    orders.push(...body.data);
    if (page >= body.pagination.totalPages) break;
  }

  const withFood = orders.map((o) => ({
    ...o,
    orderItems: (o.orderItems ?? []).map((it) => ({
      ...it,
      food: it.foodId ? foodById.get(it.foodId) ?? null : null,
    })),
  }));

  return NextResponse.json(withFood);
}
