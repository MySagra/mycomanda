"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { completeOrderLocally, togglePinnedOrder, useLocallyCompletedOrders, usePinnedOrders } from "./useMonitorState"
import type { SSEOrder } from "./types"

// How long a card that left the list stays on screen for its exit animation.
export const EXIT_ANIMATION_MS = 300

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
    const completedOrders = useLocallyCompletedOrders()
    const seenRef = useRef<Set<string>>(new Set())
    // Orders that just left the list, still drawn while they fade out. Worked
    // out during render, not in an effect: otherwise the card would unmount for
    // one frame and come back, restarting its animations.
    const [prevOrders, setPrevOrders] = useState(orders)
    const [leaving, setLeaving] = useState<Map<string, SSEOrder>>(new Map())
    if (orders !== prevOrders) {
        const currentIds = new Set(orders.map((o) => o.id))
        const gone = prevOrders.filter((o) => !currentIds.has(o.id))
        setPrevOrders(orders)
        if (gone.length > 0) setLeaving((prev) => new Map([...prev, ...gone.map((o) => [o.id, o] as const)]))
    }
    // An order taken off the completed row goes back to its arrival position.
    const [prevCompleted, setPrevCompleted] = useState(completedOrders)
    if (completedOrders !== prevCompleted) {
        const reopened = Object.keys(prevCompleted).filter((id) => !completedOrders[id])
        setPrevCompleted(completedOrders)
        if (reopened.length > 0) setOrder((prev) => reopened.reduce(atArrival, prev))
    }

    const latestRef = useRef(orders)
    const exitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    useEffect(() => {
        const timers = exitTimersRef.current
        return () => timers.forEach(clearTimeout)
    }, [])

    // Once its exit animation ends, a removed order gives up its slot and the
    // grid closes the gap. One that came back meanwhile keeps it.
    useEffect(() => {
        const timers = exitTimersRef.current
        for (const id of leaving.keys()) {
            if (timers.has(id)) continue
            timers.set(
                id,
                setTimeout(() => {
                    timers.delete(id)
                    setLeaving((prev) => new Map([...prev].filter(([other]) => other !== id)))
                    if (!latestRef.current.some((o) => o.id === id)) setOrder((prev) => prev.filter((x) => x !== id))
                }, EXIT_ANIMATION_MS),
            )
        }
    }, [leaving])

    useEffect(() => {
        latestRef.current = orders
        const currentIds = new Set(orders.map((o) => o.id))

        setOrder((prev) => {
            const byId = new Map(orders.map((o) => [o.id, o]))
            const added = orders
                .filter((o) => !seenRef.current.has(o.id))
                .sort((a, b) => arrivedAt(a) - arrivedAt(b))
            const addedIds = new Set(added.map((o) => o.id))
            const next = prev.filter((id) => !addedIds.has(id))
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

    const { pinned, regular, completed, leavingIds } = useMemo(() => {
        const current = new Map(orders.map((o) => [o.id, o]))
        const map = new Map([...leaving, ...current])
        const all = order.map((id) => map.get(id)).filter((o): o is SSEOrder => !!o)
        const unpinned = all.filter((o) => !pinnedIds.has(o.id))
        return {
            pinned: all.filter((o) => pinnedIds.has(o.id)),
            regular: unpinned.filter((o) => !completedOrders[o.id]),
            // Completed on this device only: a row of their own, after all the others.
            completed: unpinned.filter((o) => completedOrders[o.id]),
            leavingIds: new Set([...leaving.keys()].filter((id) => !current.has(id))),
        }
    }, [order, orders, leaving, pinnedIds, completedOrders])

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

    // `id` moved back to its arrival position among the unpinned orders.
    function atArrival(list: string[], id: string) {
        const byId = new Map(orders.map((o) => [o.id, o]))
        const target = byId.get(id)
        if (!target) return list
        const rest = list.filter((x) => x !== id)
        const at = rest.findIndex((x) => {
            const o = byId.get(x)
            return !!o && !pinnedIds.has(x) && arrivedAt(o) > arrivedAt(target)
        })
        return at < 0 ? [...rest, id] : [...rest.slice(0, at), id, ...rest.slice(at)]
    }

    // A newly pinned order goes to the front of the pinned row; an unpinned one
    // goes back to its arrival position in the regular grid.
    function togglePin(id: string) {
        const unpinning = pinnedIds.has(id)
        setOrder((prev) => (unpinning ? atArrival(prev, id) : [id, ...prev.filter((x) => x !== id)]))
        togglePinnedOrder(id)
    }

    // Completed on this device only: the order moves, unpinned, to the end of the completed row.
    function completeLocally(id: string) {
        setOrder((prev) => [...prev.filter((x) => x !== id), id])
        completeOrderLocally(id, orders.find((o) => o.id === id)?.orderItems ?? [])
    }

    return { pinned, regular, completed, pinnedIds, leavingIds, move, togglePin, completeLocally }
}
