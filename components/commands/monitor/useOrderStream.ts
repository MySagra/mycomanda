"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { SSEOrder } from "./types"

type ConnectionState = "loading" | "connecting" | "open" | "error"

interface Options {
    channel: string
    printerIds: string[]
}

const MAX_ORDERS = 100

// The proxy sends a keepalive event every 15s. Cloudflare Tunnel can drop the
// connection without the browser ever firing `error`, so if nothing at all
// arrives within this window we treat the stream as dead and rebuild it.
const STALE_TIMEOUT_MS = 45_000
const RECONNECT_DELAY_MS = 3_000

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
                    if (!isForSelected(data)) return
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

            // Completed elsewhere or picked up: the order no longer belongs on the monitor.
            es.addEventListener("order-status-update", (ev) => {
                const msg = ev as MessageEvent
                if (msg.lastEventId) lastEventId = msg.lastEventId
                markAlive()
                try {
                    const data = JSON.parse(msg.data) as { id: string; status: SSEOrder["status"] }
                    if (data.status === "CONFIRMED") return
                    setOrders((prev) => prev.filter((o) => o.id !== data.id))
                } catch (err) {
                    console.warn("[SSE] parse order-status-update failed", err)
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
                const { dateFrom, dateTo } = serviceDayRange(new Date())
                const params = new URLSearchParams({
                    dateFrom: dateFrom.toISOString(),
                    dateTo: dateTo.toISOString(),
                })
                const res = await fetch(`/api/orders/history?${params}`, { cache: "no-store" })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const history = (await res.json()) as SSEOrder[]
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
