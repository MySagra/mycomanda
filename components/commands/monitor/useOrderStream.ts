"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { fetchOrder, fetchServiceDayOrders } from "./serviceDayOrders"
import { clearOrderState } from "./useMonitorState"
import { EXIT_ANIMATION_MS } from "./useOrderReorder"
import type { SSEOrder } from "./types"

type ConnectionState = "loading" | "connecting" | "open" | "error"

interface Options {
    channel: string
    printerIds: string[]
}

const MAX_ORDERS = 100

// Statuses that take an order off the monitor.
const CLOSED_STATUSES = new Set<SSEOrder["status"]>(["COMPLETED", "PICKED_UP", "CANCELLED"])

// The proxy sends a keepalive event every 15s. Cloudflare Tunnel can drop the
// connection without the browser ever firing `error`, so if nothing at all
// arrives within this window we treat the stream as dead and rebuild it.
const STALE_TIMEOUT_MS = 45_000
const RECONNECT_DELAY_MS = 3_000

export function useOrderStream({ channel, printerIds }: Options) {
    const [orders, setOrders] = useState<SSEOrder[]>([])
    const [state, setState] = useState<ConnectionState>("loading")
    const [lastError, setLastError] = useState<string | null>(null)
    const esRef = useRef<EventSource | null>(null)
    // Stable effect dependency: a new array with the same ids must not reconnect.
    const printerKey = [...printerIds].sort().join(",")

    useEffect(() => {
        if (!printerKey) return
        const selected = new Set(printerKey.split(","))
        const isForSelected = (o: SSEOrder) =>
            o.orderItems?.some((it) => it.food?.printerId != null && selected.has(it.food.printerId))

        let cancelled = false
        let staleTimer: ReturnType<typeof setTimeout> | undefined
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined
        let lastEventId: string | null = null

        function addOrder(order: SSEOrder) {
            if (!isForSelected(order)) return
            setOrders((prev) => {
                const dedup = prev.filter((o) => o.id !== order.id)
                return [order, ...dedup].slice(0, MAX_ORDERS)
            })
        }

        function dropOrder(id: string) {
            setOrders((prev) => prev.filter((o) => o.id !== id))
            // After the exit animation, which still shows the ready dishes.
            setTimeout(() => clearOrderState(id), EXIT_ANIMATION_MS)
        }

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
                    addOrder(JSON.parse(msg.data) as SSEOrder)
                } catch (err) {
                    console.warn("[SSE] parse confirmed-order failed", err)
                }
            })

            es.addEventListener("order-cancelled", (ev) => {
                const msg = ev as MessageEvent
                if (msg.lastEventId) lastEventId = msg.lastEventId
                markAlive()
                try {
                    // The ticket channel sends `id`, the printer channel `orderId`.
                    const data = JSON.parse(msg.data) as { id?: string; orderId?: string }
                    const id = data.id ?? data.orderId
                    if (id) dropOrder(id)
                } catch (err) {
                    console.warn("[SSE] parse order-cancelled failed", err)
                }
            })

            // Payload: { id, ticketNumber, displayCode, status }. A completed order
            // leaves the monitor; one sent back to CONFIRMED (from the completed
            // orders page, on any device) returns, fetched in full since the
            // event carries no items.
            es.addEventListener("order-status-update", async (ev) => {
                const msg = ev as MessageEvent
                if (msg.lastEventId) lastEventId = msg.lastEventId
                markAlive()
                try {
                    const data = JSON.parse(msg.data) as { id: string; status: SSEOrder["status"] }
                    if (CLOSED_STATUSES.has(data.status)) {
                        dropOrder(data.id)
                    } else if (data.status === "CONFIRMED") {
                        const order = await fetchOrder(data.id)
                        if (!cancelled) addOrder(order)
                    }
                } catch (err) {
                    console.warn("[SSE] order-status-update failed", err)
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
                const history = await fetchServiceDayOrders("CONFIRMED")
                if (cancelled) return
                const filtered = history.filter(isForSelected)
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
    }, [channel, printerKey])

    const removeOrder = useCallback((id: string) => {
        setOrders((prev) => prev.filter((o) => o.id !== id))
    }, [])

    return { orders, state, lastError, removeOrder }
}
