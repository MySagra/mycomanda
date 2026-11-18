"use client"

import { clearLocallyCompletedOrders } from "@/components/commands/monitor/useMonitorState"
import type { SagraSettings } from "./types"

/**
 * The sagra settings, managed centrally on the backend. Loaded with
 * GET /v1/settings (server-side on the first render, see SettingsProvider) and
 * kept current by the `settings-update` SSE event. Shared by every component
 * through a module-level store, so the SSE hooks can update it directly.
 */

let current: SagraSettings | null = null
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()

function isNewer(next: SagraSettings, prev: SagraSettings | null) {
    if (!prev) return true
    const a = Date.parse(next.updatedAt)
    const b = Date.parse(prev.updatedAt)
    return Number.isNaN(a) || Number.isNaN(b) || a >= b
}

export function setSagraSettings(next: SagraSettings) {
    if (!isNewer(next, current)) return
    const prev = current
    current = next
    // Switching the sync starts over: no order completed on this device only,
    // under the previous setting, comes back to the completed row.
    if (prev && prev.settings.preparation.syncCompletion !== next.settings.preparation.syncCompletion) {
        clearLocallyCompletedOrders()
    }
    listeners.forEach((l) => l())
}

/** Seeds the store with the server-rendered settings, without notifying (safe during render). */
export function primeSagraSettings(initial: SagraSettings | null) {
    if (typeof window === "undefined" || current || !initial) return
    current = initial
}

/** Fetches the settings again, e.g. after the SSE stream was down and may have missed an update. */
export function refreshSagraSettings(): Promise<void> {
    if (inflight) return inflight
    inflight = fetch("/api/settings", { cache: "no-store" })
        .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            setSagraSettings((await res.json()) as SagraSettings)
        })
        .catch((err) => console.warn("[settings] fetch failed", err))
        .finally(() => {
            inflight = null
        })
    return inflight
}

/** Payload of the `settings-update` SSE event: the same document as GET /v1/settings. */
export function handleSettingsUpdateEvent(ev: Event) {
    try {
        setSagraSettings(JSON.parse((ev as MessageEvent).data) as SagraSettings)
    } catch (err) {
        console.warn("[SSE] parse settings-update failed", err)
    }
}

export function subscribeSagraSettings(onChange: () => void) {
    listeners.add(onChange)
    return () => {
        listeners.delete(onChange)
    }
}

export function getSagraSettings(): SagraSettings | null {
    return current
}
