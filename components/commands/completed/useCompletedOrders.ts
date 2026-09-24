"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchOrder, fetchServiceDayOrders } from "@/components/commands/monitor/serviceDayOrders"
import type { SSEOrder } from "@/components/commands/monitor/types"
import { useTicketEvents } from "./useTicketEvents"

/**
 * Completed orders of the current service day that have at least one dish for
 * the selected printers, newest completion first. Loaded on mount, then kept
 * live by the `ticket` SSE channel.
 */
export function useCompletedOrders(printerIds: string[]) {
    const [orders, setOrders] = useState<SSEOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // Stable dependency: a new array with the same ids must not refetch.
    const printerKey = [...printerIds].sort().join(",")

    // Bumped by the refresh button to run the fetch effect again.
    const [reloadToken, setReloadToken] = useState(0)

    useEffect(() => {
        if (!printerKey) return
        let cancelled = false
        const selected = new Set(printerKey.split(","))
        fetchServiceDayOrders("COMPLETED")
            .then((all) => {
                if (cancelled) return
                setOrders(all.filter((o) => o.orderItems?.some((it) => it.food?.printerId != null && selected.has(it.food.printerId))))
                setError(null)
            })
            .catch((err) => {
                console.warn("[completed] fetch failed", err)
                // Translation key: the list shows it in the current language.
                if (!cancelled) setError("completed.loadError")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [printerKey, reloadToken])

    const reload = useCallback(() => {
        setLoading(true)
        setReloadToken((t) => t + 1)
    }, [])

    const removeOrder = useCallback((id: string) => {
        setOrders((prev) => prev.filter((o) => o.id !== id))
    }, [])

    useTicketEvents({
        // A completion carries no items, so the order is fetched in full; any
        // other status (sent back to CONFIRMED, picked up) takes it off the list.
        onStatusUpdate: async ({ id, status }) => {
            if (status !== "COMPLETED") {
                removeOrder(id)
                return
            }
            try {
                const order = await fetchOrder(id)
                const selected = new Set(printerKey.split(","))
                if (!order.orderItems.some((it) => it.food?.printerId != null && selected.has(it.food.printerId))) return
                setOrders((prev) => [order, ...prev.filter((o) => o.id !== id)])
            } catch (err) {
                console.warn("[completed] fetch completed order failed", err)
            }
        },
        onCancelled: removeOrder,
    })

    return { orders, loading, error, reload, removeOrder }
}
