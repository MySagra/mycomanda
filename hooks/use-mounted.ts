"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * False on the server and during hydration, true afterwards. For UI that
 * depends on browser-only state (theme, localStorage) and would otherwise
 * cause a hydration mismatch.
 */
export function useMounted() {
    return useSyncExternalStore(subscribe, () => true, () => false)
}
