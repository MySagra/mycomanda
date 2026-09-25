"use client"

import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "mycomanda_auto_completion"
// `storage` only fires in other tabs, so same-tab updates use their own event.
const CHANGE_EVENT = "mycomanda:auto-completion"

function readStored(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) !== "false"
    } catch {
        return true
    }
}

function subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange)
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => {
        window.removeEventListener("storage", onChange)
        window.removeEventListener(CHANGE_EVENT, onChange)
    }
}

/**
 * On by default: completing an order closes it on the server. When off, the
 * order only moves to the end of the monitor. Saved on this device.
 */
export function useAutoCompletion() {
    const autoCompletion = useSyncExternalStore(subscribe, readStored, () => true)

    const setAutoCompletion = useCallback((value: boolean) => {
        try {
            localStorage.setItem(STORAGE_KEY, String(value))
        } catch {
            // ignore
        }
        window.dispatchEvent(new Event(CHANGE_EVENT))
    }, [])

    return { autoCompletion, setAutoCompletion }
}
