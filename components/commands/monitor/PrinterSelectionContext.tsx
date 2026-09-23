"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { Printer } from "./types"

const STORAGE_KEY = "mycomanda_selected_printers"
// Single-printer selection saved by older versions, migrated on first load.
const LEGACY_STORAGE_KEY = "mycomanda_selected_printer"

interface StoredPrinter {
    id: string
    name: string
}

interface Ctx {
    printers: StoredPrinter[]
    hydrated: boolean
    select: (printers: Printer[]) => void
    dialogOpen: boolean
    setDialogOpen: (open: boolean) => void
}

const PrinterSelectionContext = createContext<Ctx | null>(null)

function readStored(): StoredPrinter[] {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
        const parsed = JSON.parse(raw) as StoredPrinter[]
        return Array.isArray(parsed) ? parsed.filter((p) => p?.id) : []
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) {
        const parsed = JSON.parse(legacy) as StoredPrinter
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        if (parsed?.id) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([parsed]))
            return [parsed]
        }
    }
    return []
}

export function PrinterSelectionProvider({ children }: { children: ReactNode }) {
    const [printers, setPrinters] = useState<StoredPrinter[]>([])
    const [hydrated, setHydrated] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => {
        try {
            setPrinters(readStored())
        } catch {
            // ignore
        }
        setHydrated(true)
    }, [])

    const select = useCallback((selected: Printer[]) => {
        const stored: StoredPrinter[] = selected.map((p) => ({ id: p.id, name: p.name }))
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
        } catch {
            // ignore
        }
        setPrinters(stored)
    }, [])

    return (
        <PrinterSelectionContext.Provider value={{ printers, hydrated, select, dialogOpen, setDialogOpen }}>
            {children}
        </PrinterSelectionContext.Provider>
    )
}

export function usePrinterSelection(): Ctx {
    const ctx = useContext(PrinterSelectionContext)
    if (!ctx) throw new Error("usePrinterSelection must be used inside PrinterSelectionProvider")
    return ctx
}
