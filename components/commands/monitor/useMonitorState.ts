"use client"

import { useSyncExternalStore } from "react"
import type { SSEOrderItem } from "./types"

/**
 * Kitchen-side state of the orders on this device, kept in localStorage as JSON:
 *
 *   {
 *     "version": 1,
 *     "items": {
 *       "<orderItemId>": { "orderId", "orderItemId", "foodId", "completed", "updatedAt" }
 *     },
 *     "pinned": {
 *       "<orderId>": { "orderId", "pinnedAt" }
 *     }
 *   }
 *
 * Item progress is keyed by order item, not by food: the same food can appear
 * twice in one order with different notes.
 */

const STORAGE_KEY = "mycomanda_monitor_state"
// Earlier versions kept only the item progress, under this key.
const LEGACY_STORAGE_KEY = "mycomanda_item_progress"
// Older entries belong to a closed service day.
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export interface ItemProgress {
    orderId: string
    orderItemId: string
    foodId: string | null
    completed: number
    updatedAt: string
}

export interface PinnedOrder {
    orderId: string
    pinnedAt: string
}

interface MonitorState {
    version: 1
    items: Record<string, ItemProgress>
    pinned: Record<string, PinnedOrder>
}

const EMPTY: MonitorState = { version: 1, items: {}, pinned: {} }

let cache: MonitorState | null = null
const listeners = new Set<() => void>()

function recent<T>(entries: Record<string, T> | undefined, date: (entry: T) => string): Record<string, T> {
    const cutoff = Date.now() - MAX_AGE_MS
    return Object.fromEntries(Object.entries(entries ?? {}).filter(([, e]) => Date.parse(date(e)) >= cutoff))
}

function read(): MonitorState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
        const parsed = raw ? (JSON.parse(raw) as Partial<MonitorState>) : null
        if (parsed?.version !== 1) return EMPTY
        return {
            version: 1,
            items: recent(parsed.items, (p) => p.updatedAt),
            pinned: recent(parsed.pinned, (p) => p.pinnedAt),
        }
    } catch {
        return EMPTY
    }
}

function getSnapshot(): MonitorState {
    if (!cache) cache = read()
    return cache
}

function write(next: MonitorState) {
    cache = next
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch {
        // ignore
    }
    listeners.forEach((l) => l())
}

function subscribe(onChange: () => void) {
    listeners.add(onChange)
    // Another tab on the same device updated the state.
    function onStorage(e: StorageEvent) {
        if (e.key !== STORAGE_KEY) return
        cache = read()
        onChange()
    }
    window.addEventListener("storage", onStorage)
    return () => {
        listeners.delete(onChange)
        window.removeEventListener("storage", onStorage)
    }
}

/**
 * One more portion of the item is ready. Past the full quantity the count
 * starts again from zero, so a mistaken tap can be undone.
 */
export function advanceItem(orderId: string, item: SSEOrderItem) {
    const current = getSnapshot()
    const done = current.items[item.id]?.completed ?? 0
    const completed = done >= item.quantity ? 0 : done + 1
    const items = { ...current.items }
    if (completed === 0) {
        delete items[item.id]
    } else {
        items[item.id] = {
            orderId,
            orderItemId: item.id,
            foodId: item.foodId ?? item.food?.id ?? null,
            completed,
            updatedAt: new Date().toISOString(),
        }
    }
    write({ ...current, items })
}

export function togglePinnedOrder(orderId: string) {
    const current = getSnapshot()
    const pinned = { ...current.pinned }
    if (pinned[orderId]) delete pinned[orderId]
    else pinned[orderId] = { orderId, pinnedAt: new Date().toISOString() }
    write({ ...current, pinned })
}

/** Drops everything stored about an order that has left the monitor. */
export function clearOrderState(orderId: string) {
    const current = getSnapshot()
    const items = Object.fromEntries(Object.entries(current.items).filter(([, p]) => p.orderId !== orderId))
    const unchanged = Object.keys(items).length === Object.keys(current.items).length && !current.pinned[orderId]
    if (unchanged) return
    const pinned = { ...current.pinned }
    delete pinned[orderId]
    write({ ...current, items, pinned })
}

function useMonitorState() {
    return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
}

export function useItemProgress() {
    return useMonitorState().items
}

export function usePinnedOrders() {
    return useMonitorState().pinned
}
