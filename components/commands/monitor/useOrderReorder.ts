"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { SSEOrder } from "./types"

export function useOrderReorder(orders: SSEOrder[]) {
    const [order, setOrder] = useState<string[]>([])
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

    const ordered = useMemo(() => {
        const map = new Map(orders.map((o) => [o.id, o]))
        return order.map((id) => map.get(id)).filter((o): o is SSEOrder => !!o)
    }, [order, orders])

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

    return { ordered, move }
}
