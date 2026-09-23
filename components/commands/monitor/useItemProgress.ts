"use client"

import { useSyncExternalStore } from "react"
import type { SSEOrderItem } from "./types"

/**
 * Per-dish progress of the orders on this device, kept in localStorage as JSON:
 *
 *   {
 *     "version": 1,
 *     "items": {
 *       "<orderItemId>": { "orderId", "orderItemId", "foodId", "completed", "updatedAt" }
 *     }
 *   }
 *
 * Entries are keyed by order item, not by food: the same food can appear twice
 * in one order with different notes.
 */

const STORAGE_KEY = "mycomanda_item_progress"
// Older entries belong to a closed service day.
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export interface ItemProgress {
    orderId: string
    orderItemId: string
    foodId: string | null
    completed: number
    updatedAt: string
}

interface ProgressFile {
    version: 1
    items: Record<string, ItemProgress>
}

const EMPTY: ProgressFile = { version: 1, items: {} }

let cache: ProgressFile | null = null
const listeners = new Set<() => void>()

function read(): ProgressFile {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const parsed = raw ? (JSON.parse(raw) as ProgressFile) : null
        if (parsed?.version !== 1 || typeof parsed.items !== "object") return EMPTY
        const cutoff = Date.now() - MAX_AGE_MS
        const items = Object.fromEntries(
            Object.entries(parsed.items).filter(([, p]) => Date.parse(p.updatedAt) >= cutoff),
        )
        return { version: 1, items }
    } catch {
        return EMPTY
    }
}

function getSnapshot(): ProgressFile {
    if (!cache) cache = read()
    return cache
}

function write(next: ProgressFile) {
    cache = next
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
        // ignore
    }
    listeners.forEach((l) => l())
}

function subscribe(onChange: () => void) {
    listeners.add(onChange)
    // Another tab on the same device updated the file.
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
    write({ version: 1, items })
}

/** Drops the progress of an order that has left the monitor. */
export function clearOrderProgress(orderId: string) {
    const current = getSnapshot()
    const items = Object.fromEntries(Object.entries(current.items).filter(([, p]) => p.orderId !== orderId))
    if (Object.keys(items).length === Object.keys(current.items).length) return
    write({ version: 1, items })
}

export function useItemProgress() {
    return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY).items
}
