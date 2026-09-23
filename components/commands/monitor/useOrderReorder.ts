"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { togglePinnedOrder, usePinnedOrders } from "./useMonitorState"
import type { SSEOrder } from "./types"

export function useOrderReorder(orders: SSEOrder[]) {
    const [order, setOrder] = useState<string[]>([])
    // Pins are persisted, so they survive a reload. They are not pruned against
    // `orders`: an empty list after a failed history fetch would wipe them.
    const pinnedOrders = usePinnedOrders()
    const pinnedIds = useMemo(() => new Set(Object.keys(pinnedOrders)), [pinnedOrders])
    const seenRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        const currentIds = new Set(orders.map((o) => o.id))

        setOrder((prev) => {
            const kept = prev.filter((id) => currentIds.has(id))
            const newIds = orders
                .map((o) => o.id)
                .filter((id) => !seenRef.current.has(id))
            newIds.forEach((id) => seenRef.current.add(id))
            return [...newIds, ...kept]
        })

        seenRef.current.forEach((id) => {
            if (!currentIds.has(id)) seenRef.current.delete(id)
        })
    }, [orders])

    const { pinned, unpinned } = useMemo(() => {
        const map = new Map(orders.map((o) => [o.id, o]))
        const all = order.map((id) => map.get(id)).filter((o): o is SSEOrder => !!o)
        return {
            pinned: all.filter((o) => pinnedIds.has(o.id)),
            unpinned: all.filter((o) => !pinnedIds.has(o.id)),
        }
    }, [order, orders, pinnedIds])

    function move(fromId: string, toId: string) {
        if (fromId === toId) return
        setOrder((prev) => {
            const from = prev.indexOf(fromId)
            const to = prev.indexOf(toId)
            if (from < 0 || to < 0) return prev
            const next = prev.slice()
            const [item] = next.splice(from, 1)
            next.splice(to, 0, item)
            return next
        })
    }

    // A newly pinned order goes to the front of the pinned row; an unpinned one
    // goes back to the front of the regular grid.
    function togglePin(id: string) {
        setOrder((prev) => [id, ...prev.filter((x) => x !== id)])
        togglePinnedOrder(id)
    }

    return { pinned, unpinned, pinnedIds, move, togglePin }
}
