"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { usePrinterSelection } from "@/components/commands/monitor/PrinterSelectionContext"
import { UsageGuide } from "./UsageGuide"

// Set by the login form, consumed by the first page that shows the guide.
const PENDING_KEY = "mycomanda_guide_pending"
// The guide has opened on its own once on this device; from then on only the
// header button opens it.
const SEEN_KEY = "mycomanda_guide_seen"
// Lets the monitor render before the guide slides in on top of it.
const AUTO_OPEN_DELAY_MS = 400

/** Called by the login form right before it redirects to the monitor. */
export function markGuidePending() {
    try {
        sessionStorage.setItem(PENDING_KEY, "1")
    } catch {
        // ignore
    }
}

interface Ctx {
    openGuide: () => void
}

const GuideContext = createContext<Ctx | null>(null)

/**
 * Owns the usage guide: opens it after the first login on this device, and on
 * demand from the header. Needs PrinterSelectionProvider above it.
 */
export function GuideProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false)
    const { printers, hydrated, dialogOpen } = usePrinterSelection()
    // The printer dialog comes first: the guide waits until it is done.
    const printersReady = hydrated && printers.length > 0 && !dialogOpen

    useEffect(() => {
        if (!printersReady) return
        const timer = setTimeout(() => {
            try {
                const pending = sessionStorage.getItem(PENDING_KEY) === "1"
                sessionStorage.removeItem(PENDING_KEY)
                if (!pending || localStorage.getItem(SEEN_KEY) === "1") return
                localStorage.setItem(SEEN_KEY, "1")
                setOpen(true)
            } catch {
                // ignore
            }
        }, AUTO_OPEN_DELAY_MS)
        return () => clearTimeout(timer)
    }, [printersReady])

    const openGuide = useCallback(() => setOpen(true), [])

    return (
        <GuideContext.Provider value={{ openGuide }}>
            {children}
            <UsageGuide open={open} onClose={() => setOpen(false)} />
        </GuideContext.Provider>
    )
}

export function useGuide(): Ctx {
    const ctx = useContext(GuideContext)
    if (!ctx) throw new Error("useGuide must be used inside GuideProvider")
    return ctx
}
