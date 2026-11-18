"use client"

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react"
import {
    getSagraSettings,
    primeSagraSettings,
    refreshSagraSettings,
    subscribeSagraSettings,
} from "./store"
import type { SagraSettings } from "./types"

const InitialSettingsContext = createContext<SagraSettings | null>(null)

export function SettingsProvider({
    initial,
    children,
}: {
    initial: SagraSettings | null
    children: React.ReactNode
}) {
    // Before any child effect: the monitor bootstrap already needs the timezone.
    useState(() => primeSagraSettings(initial))

    useEffect(() => {
        // Rendered without the settings although logged in (backend briefly down): retry now.
        // Without a session (login page) there is nothing to load: login reloads the page.
        const loggedIn = /(?:^|;\s*)mycomanda_user=/.test(document.cookie)
        if (loggedIn && !getSagraSettings()) refreshSagraSettings()
    }, [])

    return <InitialSettingsContext.Provider value={initial}>{children}</InitialSettingsContext.Provider>
}

export interface SagraSettingsView {
    sagraName: string | null
    /** IANA timezone of the sagra; undefined falls back to the device's own. */
    timezone: string | undefined
    showNumbers: boolean
    /** Completing an order marks it COMPLETED on the server too. */
    syncCompletion: boolean
}

export function toView(s: SagraSettings | null): SagraSettingsView {
    return {
        sagraName: s?.sagra?.name ?? null,
        timezone: s?.settings?.general?.timezone || undefined,
        showNumbers: s?.settings?.tickets?.showNumbers ?? false,
        syncCompletion: s?.settings?.preparation?.syncCompletion ?? true,
    }
}

export function useSagraSettings(): SagraSettingsView {
    const initial = useContext(InitialSettingsContext)
    const settings = useSyncExternalStore(
        subscribeSagraSettings,
        () => getSagraSettings() ?? initial,
        () => initial,
    )
    return toView(settings)
}
