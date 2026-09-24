"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { RefreshCw } from "lucide-react"
import type { CashRegister, Printer } from "./types"
import { useTranslation } from "react-i18next"

/** Loads the printers a kitchen monitor can follow. */
export function useSelectablePrinters() {
    const [printers, setPrinters] = useState<Printer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { t } = useTranslation()

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [printersRes, cashRegistersRes] = await Promise.all([
                fetch("/api/printers", { cache: "no-store" }),
                fetch("/api/cash-registers", { cache: "no-store" }),
            ])
            if (!printersRes.ok) throw new Error(`HTTP ${printersRes.status}`)
            if (!cashRegistersRes.ok) throw new Error(`HTTP ${cashRegistersRes.status}`)
            const data = (await printersRes.json()) as Printer[]
            const cashRegisters = (await cashRegistersRes.json()) as CashRegister[]
            // Printers bound to an enabled cash register print receipts, not kitchen tickets.
            const cashRegisterPrinterIds = new Set(
                (Array.isArray(cashRegisters) ? cashRegisters : [])
                    .filter((c) => c.enabled)
                    .map((c) => c.defaultPrinterId)
            )
            setPrinters((Array.isArray(data) ? data : []).filter((p) => !cashRegisterPrinterIds.has(p.id)))
        } catch (e) {
            setError(e instanceof Error ? e.message : t("printers.loadError"))
        } finally {
            setLoading(false)
        }
    }, [t])

    useEffect(() => {
        load()
    }, [load])

    return { printers, loading, error, reload: load }
}

interface Props {
    printers: Printer[]
    loading: boolean
    error: string | null
    onRetry: () => void
    checked: Set<string>
    onToggle: (id: string, value: boolean) => void
}

export function PrinterList({ printers, loading, error, onRetry, checked, onToggle }: Props) {
    const { t } = useTranslation()

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Spinner />
            </div>
        )
    }

    if (error) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyTitle>{t("common.error")}</EmptyTitle>
                    <EmptyDescription>{error}</EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                    <RefreshCw className="h-4 w-4" />
                    {t("common.retry")}
                </Button>
            </Empty>
        )
    }

    if (printers.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyTitle>{t("printers.emptyTitle")}</EmptyTitle>
                    <EmptyDescription>{t("printers.emptyDescription")}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        )
    }

    return (
        <>
            {printers.map((p) => (
                <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/5"
                >
                    <Checkbox
                        checked={checked.has(p.id)}
                        onCheckedChange={(value) => onToggle(p.id, value)}
                    />
                    <span className="flex flex-1 flex-col items-start gap-0.5">
                        <span className="font-medium">{p.name}</span>
                        {p.description && (
                            <span className="text-xs text-muted-foreground">{p.description}</span>
                        )}
                    </span>
                    {p.status && (
                        <Badge
                            variant={p.status === "ONLINE" ? "default" : p.status === "ERROR" ? "destructive" : "secondary"}
                        >
                            {p.status}
                        </Badge>
                    )}
                </label>
            ))}
        </>
    )
}

export function toggleInSet(prev: Set<string>, id: string, value: boolean): Set<string> {
    const next = new Set(prev)
    if (value) next.add(id)
    else next.delete(id)
    return next
}
