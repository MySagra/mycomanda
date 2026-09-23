"use client"

import { useEffect, useRef } from "react"
import type { SSEOrder } from "@/components/commands/monitor/types"

export interface OrderStatusUpdate {
    id: string
    ticketNumber: number | null
    displayCode: string
    status: SSEOrder["status"]
}

interface Handlers {
    onStatusUpdate: (update: OrderStatusUpdate) => void
    onCancelled: (id: string) => void
}

// Same watchdog as the live monitor: the proxy sends a keepalive every 15s, and
// Cloudflare Tunnel can drop the stream without the browser firing `error`.
const STALE_TIMEOUT_MS = 45_000
const RECONNECT_DELAY_MS = 3_000

/** Status changes and cancellations from the `ticket` SSE channel. */
export function useTicketEvents(handlers: Handlers) {
    const handlersRef = useRef(handlers)

    useEffect(() => {
        handlersRef.current = handlers
    })

    useEffect(() => {
        let es: EventSource | null = null
        let cancelled = false
        let staleTimer: ReturnType<typeof setTimeout> | undefined
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined
        let lastEventId: string | null = null

        function reconnect(reason: string) {
            if (cancelled) return
            console.warn("[completed SSE] reconnecting:", reason)
            es?.close()
            if (staleTimer) clearTimeout(staleTimer)
            reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
        }

        function markAlive(ev?: Event) {
            const id = (ev as MessageEvent | undefined)?.lastEventId
            if (id) lastEventId = id
            if (staleTimer) clearTimeout(staleTimer)
            staleTimer = setTimeout(() => reconnect("no data received"), STALE_TIMEOUT_MS)
        }

        function connect() {
            if (cancelled) return
            es = new EventSource(
                lastEventId ? `/api/events/ticket?lastEventId=${encodeURIComponent(lastEventId)}` : "/api/events/ticket",
            )
            markAlive()
            es.onopen = () => markAlive()
            es.onmessage = markAlive
            es.addEventListener("keepalive", markAlive)

            es.addEventListener("order-status-update", (ev) => {
                markAlive(ev)
                try {
                    handlersRef.current.onStatusUpdate(JSON.parse((ev as MessageEvent).data) as OrderStatusUpdate)
                } catch (err) {
                    console.warn("[completed SSE] parse order-status-update failed", err)
                }
            })

            es.addEventListener("order-cancelled", (ev) => {
                markAlive(ev)
                try {
                    const data = JSON.parse((ev as MessageEvent).data) as { id?: string; orderId?: string }
                    const id = data.id ?? data.orderId
                    if (id) handlersRef.current.onCancelled(id)
                } catch (err) {
                    console.warn("[completed SSE] parse order-cancelled failed", err)
                }
            })

            es.onerror = () => {
                if (es?.readyState === EventSource.CLOSED) reconnect("closed by server")
            }
        }

        connect()

        return () => {
            cancelled = true
            if (staleTimer) clearTimeout(staleTimer)
            if (reconnectTimer) clearTimeout(reconnectTimer)
            es?.close()
        }
    }, [])
}
