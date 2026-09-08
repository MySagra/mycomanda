"use client"

import { useEffect, useRef, useState } from "react"
import type { SSEOrder } from "./types"

type ConnectionState = "loading" | "connecting" | "open" | "error"

interface Options {
    channel: string
    printerId: string
}

const MAX_ORDERS = 100

export function useOrderStream({ channel, printerId }: Options) {
    const [orders, setOrders] = useState<SSEOrder[]>([])
    const [state, setState] = useState<ConnectionState>("loading")
    const [lastError, setLastError] = useState<string | null>(null)
    const esRef = useRef<EventSource | null>(null)

    useEffect(() => {
        if (!printerId) return

        let cancelled = false

        async function bootstrap() {
            setState("loading")
            setLastError(null)
            try {
                const res = await fetch("/api/orders/history", { cache: "no-store" })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const history = (await res.json()) as SSEOrder[]
                if (cancelled) return
                const filtered = history.filter((o) =>
                    o.orderItems?.some((it) => it.food?.printerId === printerId),
                )
                setOrders(filtered.slice(0, MAX_ORDERS))
            } catch (err) {
                console.warn("[history] fetch failed", err)
                if (!cancelled) setLastError("Impossibile caricare ordini precedenti")
            }

            if (cancelled) return

            const url = `/api/events/${channel}`
            console.info("[SSE] connecting to", url)
            const es = new EventSource(url)
            esRef.current = es
            setState("connecting")

            es.onopen = () => {
                console.info("[SSE] open")
                setState("open")
                setLastError(null)
            }

            es.addEventListener("confirmed-order", (ev) => {
                try {
                    const data = JSON.parse((ev as MessageEvent).data) as SSEOrder
                    if (!data.orderItems?.some((it) => it.food?.printerId === printerId)) return
                    setOrders((prev) => {
                        const dedup = prev.filter((o) => o.id !== data.id)
                        return [data, ...dedup].slice(0, MAX_ORDERS)
                    })
                } catch (err) {
                    console.warn("[SSE] parse confirmed-order failed", err)
                }
            })

            es.addEventListener("order-cancelled", (ev) => {
                try {
                    const data = JSON.parse((ev as MessageEvent).data) as { orderId: string }
                    setOrders((prev) => prev.filter((o) => o.id !== data.orderId))
                } catch (err) {
                    console.warn("[SSE] parse order-cancelled failed", err)
                }
            })

            es.onerror = () => {
                const readyState = es.readyState
                console.error("[SSE] error, readyState=", readyState)
                if (readyState === EventSource.CLOSED) {
                    setState("error")
                    setLastError("Connessione chiusa dal server")
                } else {
                    setState("connecting")
                    setLastError("Riconnessione in corso...")
                }
            }
        }

        bootstrap()

        return () => {
            cancelled = true
            console.info("[SSE] closing")
            esRef.current?.close()
            esRef.current = null
        }
    }, [channel, printerId])

    return { orders, state, lastError }
}
