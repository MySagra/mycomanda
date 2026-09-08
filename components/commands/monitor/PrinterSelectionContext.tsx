"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { Printer } from "./types"

const STORAGE_KEY = "mycomanda_selected_printer"

interface StoredPrinter {
    id: string
    name: string
}

interface Ctx {
    printer: StoredPrinter | null
    hydrated: boolean
    select: (p: Printer) => void
    clear: () => void
}

const PrinterSelectionContext = createContext<Ctx | null>(null)

export function PrinterSelectionProvider({ children }: { children: ReactNode }) {
    const [printer, setPrinter] = useState<StoredPrinter | null>(null)
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw) as StoredPrinter
                if (parsed?.id) setPrinter(parsed)
            }
        } catch {
            // ignore
        }
        setHydrated(true)
    }, [])

    const select = useCallback((p: Printer) => {
        const stored: StoredPrinter = { id: p.id, name: p.name }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
        setPrinter(stored)
    }, [])

    const clear = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY)
        setPrinter(null)
    }, [])

    return (
        <PrinterSelectionContext.Provider value={{ printer, hydrated, select, clear }}>
            {children}
        </PrinterSelectionContext.Provider>
    )
}

export function usePrinterSelection(): Ctx {
    const ctx = useContext(PrinterSelectionContext)
    if (!ctx) throw new Error("usePrinterSelection must be used inside PrinterSelectionProvider")
    return ctx
}
