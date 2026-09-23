"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { togglePinnedOrder, usePinnedOrders } from "./useMonitorState"
import type { SSEOrder } from "./types"

// When the order reached the kitchen. The grid shows the oldest first: the
// kitchen works through orders in the order they came in.
function arrivedAt(o: SSEOrder) {
    return Date.parse(o.confirmedAt ?? o.createdAt)
}

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
            const byId = new Map(orders.map((o) => [o.id, o]))
            const next = prev.filter((id) => currentIds.has(id))
            const added = orders
                .filter((o) => !seenRef.current.has(o.id))
                .sort((a, b) => arrivedAt(a) - arrivedAt(b))
            // Each new order goes before the first later one, so a brand new order
            // lands at the end and one sent back from the completed page returns
            // to its time slot. Cards moved by hand keep their place.
            for (const o of added) {
                seenRef.current.add(o.id)
                const at = next.findIndex((id) => {
                    const other = byId.get(id)
                    return !!other && arrivedAt(other) > arrivedAt(o)
                })
                if (at < 0) next.push(o.id)
                else next.splice(at, 0, o.id)
            }
            return next
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
    // goes back to its arrival position in the regular grid.
    function togglePin(id: string) {
        const unpinning = pinnedIds.has(id)
        setOrder((prev) => {
            const rest = prev.filter((x) => x !== id)
            if (!unpinning) return [id, ...rest]
            const byId = new Map(orders.map((o) => [o.id, o]))
            const target = byId.get(id)
            if (!target) return prev
            const at = rest.findIndex((x) => {
                const o = byId.get(x)
                return !!o && !pinnedIds.has(x) && arrivedAt(o) > arrivedAt(target)
            })
            return at < 0 ? [...rest, id] : [...rest.slice(0, at), id, ...rest.slice(at)]
        })
        togglePinnedOrder(id)
    }

    return { pinned, unpinned, pinnedIds, move, togglePin }
}
