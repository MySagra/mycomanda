import type { SSEOrder } from "./types"
import { getSagraSettings } from "@/lib/settings/store"
import { serviceDayRange } from "@/lib/settings/time"

/** Orders of the current service day in the given status, with their foods joined in. */
export async function fetchServiceDayOrders(status: "CONFIRMED" | "COMPLETED"): Promise<SSEOrder[]> {
    const { dateFrom, dateTo } = serviceDayRange(new Date(), getSagraSettings()?.settings.general.timezone || undefined)
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
