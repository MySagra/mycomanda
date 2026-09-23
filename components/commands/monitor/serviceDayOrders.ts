import type { SSEOrder } from "./types"

// The backend closes the service day at 07:00, so a day runs from 07:00 to
// 06:59:59.999 of the next calendar day. Before 07:00 we are still in the
// service day that started yesterday morning.
const SERVICE_DAY_START_HOUR = 7

function serviceDayRange(now: Date) {
    const dateFrom = new Date(now)
    dateFrom.setHours(SERVICE_DAY_START_HOUR, 0, 0, 0)
    if (now < dateFrom) dateFrom.setDate(dateFrom.getDate() - 1)
    const dateTo = new Date(dateFrom)
    dateTo.setDate(dateTo.getDate() + 1)
    dateTo.setMilliseconds(-1)
    return { dateFrom, dateTo }
}

/** Orders of the current service day in the given status, with their foods joined in. */
export async function fetchServiceDayOrders(status: "CONFIRMED" | "COMPLETED"): Promise<SSEOrder[]> {
    const { dateFrom, dateTo } = serviceDayRange(new Date())
    const params = new URLSearchParams({
        status,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
    })
    const res = await fetch(`/api/orders/history?${params}`, { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as SSEOrder[]
}

/** One order with its items and foods, in the SSE `confirmed-order` shape. */
export async function fetchOrder(id: string): Promise<SSEOrder> {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as SSEOrder
}

/** Sets the status of an order through the PATCH proxy. */
export async function patchOrderStatus(id: string, status: "COMPLETED" | "CONFIRMED") {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
