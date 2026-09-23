"use client"

import { useEffect, useRef, useState } from "react"
import type { SSEOrder } from "./types"

type ConnectionState = "loading" | "connecting" | "open" | "error"

interface Options {
    channel: string
    printerId: string
}

const MAX_ORDERS = 100

// The proxy sends a keepalive event every 15s. Cloudflare Tunnel can drop the
// connection without the browser ever firing `error`, so if nothing at all
// arrives within this window we treat the stream as dead and rebuild it.
const STALE_TIMEOUT_MS = 45_000
const RECONNECT_DELAY_MS = 3_000

export function useOrderStream({ channel, printerId }: Options) {
    const [orders, setOrders] = useState<SSEOrder[]>([])
    const [state, setState] = useState<ConnectionState>("loading")
    const [lastError, setLastError] = useState<string | null>(null)
    const esRef = useRef<EventSource | null>(null)

    useEffect(() => {
        if (!printerId) return

        let cancelled = false
        let staleTimer: ReturnType<typeof setTimeout> | undefined
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined
        let lastEventId: string | null = null

        function closeStream() {
            esRef.current?.close()
            esRef.current = null
        }

        function clearTimers() {
            if (staleTimer) clearTimeout(staleTimer)
            if (reconnectTimer) clearTimeout(reconnectTimer)
        }

        function scheduleReconnect(reason: string) {
            if (cancelled) return
            clearTimers()
            closeStream()
            setState("connecting")
            setLastError("Riconnessione in corso...")
            console.warn("[SSE] reconnecting:", reason)
            reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
        }

        // Any traffic, data or keepalive event, proves the tunnel is still up.
        function markAlive() {
            if (staleTimer) clearTimeout(staleTimer)
            staleTimer = setTimeout(() => scheduleReconnect("no data received"), STALE_TIMEOUT_MS)
        }

        function connect() {
            if (cancelled) return

            // A manual reconnect loses the browser's own Last-Event-ID handling, so
            // the id of the last event we saw travels in the query string instead.
            const url = lastEventId
                ? `/api/events/${channel}?lastEventId=${encodeURIComponent(lastEventId)}`
                : `/api/events/${channel}`
            console.info("[SSE] connecting to", url)

            const es = new EventSource(url)
            esRef.current = es
            setState("connecting")
            markAlive()

            es.onopen = () => {
                console.info("[SSE] open")
                setState("open")
                setLastError(null)
                markAlive()
            }

            es.onmessage = (ev) => {
                if (ev.lastEventId) lastEventId = ev.lastEventId
                markAlive()
            }

            // Heartbeat from the proxy: no payload, it only proves the tunnel is up.
            es.addEventListener("keepalive", markAlive)

            es.addEventListener("confirmed-order", (ev) => {
                const msg = ev as MessageEvent
                if (msg.lastEventId) lastEventId = msg.lastEventId
                markAlive()
                try {
                    const data = JSON.parse(msg.data) as SSEOrder
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
                const msg = ev as MessageEvent
                if (msg.lastEventId) lastEventId = msg.lastEventId
                markAlive()
                try {
                    const data = JSON.parse(msg.data) as { orderId: string }
                    setOrders((prev) => prev.filter((o) => o.id !== data.orderId))
                } catch (err) {
                    console.warn("[SSE] parse order-cancelled failed", err)
                }
            })

            es.onerror = () => {
                console.error("[SSE] error, readyState=", es.readyState)
                if (es.readyState === EventSource.CLOSED) {
                    scheduleReconnect("closed by server")
                } else {
                    setState("connecting")
                    setLastError("Riconnessione in corso...")
                }
            }
        }

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
            connect()
        }

        // A backgrounded tab often has its stream killed by the tunnel; check it
        // as soon as the tab is visible again instead of waiting for the timeout.
        function onVisibilityChange() {
            if (document.visibilityState !== "visible") return
            if (esRef.current?.readyState !== EventSource.OPEN) {
                scheduleReconnect("tab became visible")
            }
        }

        document.addEventListener("visibilitychange", onVisibilityChange)
        bootstrap()

        return () => {
            cancelled = true
            console.info("[SSE] closing")
            document.removeEventListener("visibilitychange", onVisibilityChange)
            clearTimers()
            closeStream()
        }
    }, [channel, printerId])

    return { orders, state, lastError }
}
