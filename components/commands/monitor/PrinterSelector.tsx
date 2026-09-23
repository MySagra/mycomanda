"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Printer as PrinterIcon, RefreshCw } from "lucide-react"
import type { Printer } from "./types"

interface Props {
    open: boolean
    // Without a current selection the dialog cannot be dismissed: the monitor
    // has nothing to show until at least one printer is chosen.
    required: boolean
    selectedIds: string[]
    onOpenChange: (open: boolean) => void
    onConfirm: (printers: Printer[]) => void
}

export function PrinterSelector({ open, required, selectedIds, onOpenChange, onConfirm }: Props) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next && required) return
                onOpenChange(next)
            }}
        >
            <DialogContent showCloseButton={!required} className="sm:max-w-lg">
                {/* The popup unmounts on close, so every open reloads the list
                    and starts the draft from the saved selection. */}
                <PrinterSelectorBody
                    required={required}
                    selectedIds={selectedIds}
                    onCancel={() => onOpenChange(false)}
                    onConfirm={(printers) => {
                        onConfirm(printers)
                        onOpenChange(false)
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}

interface BodyProps {
    required: boolean
    selectedIds: string[]
    onCancel: () => void
    onConfirm: (printers: Printer[]) => void
}

function PrinterSelectorBody({ required, selectedIds, onCancel, onConfirm }: BodyProps) {
    const [printers, setPrinters] = useState<Printer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [checked, setChecked] = useState<Set<string>>(() => new Set(selectedIds))

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/printers", { cache: "no-store" })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = (await res.json()) as Printer[]
            setPrinters(Array.isArray(data) ? data : [])
        } catch (e) {
            setError(e instanceof Error ? e.message : "Errore caricamento stampanti")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    function toggle(id: string, value: boolean) {
        setChecked((prev) => {
            const next = new Set(prev)
            if (value) next.add(id)
            else next.delete(id)
            return next
        })
    }

    function confirm() {
        onConfirm(printers.filter((p) => checked.has(p.id)))
    }

    const selectedCount = printers.filter((p) => checked.has(p.id)).length

    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <PrinterIcon className="h-5 w-5" />
                    Seleziona stampanti
                </DialogTitle>
                <DialogDescription>
                    Scegli una o più stampanti da monitorare. Verranno mostrate solo le comande destinate alle stampanti selezionate.
                </DialogDescription>
            </DialogHeader>

            <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <Spinner />
                    </div>
                )}

                {!loading && error && (
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>Errore</EmptyTitle>
                            <EmptyDescription>{error}</EmptyDescription>
                        </EmptyHeader>
                        <Button variant="outline" size="sm" onClick={load} className="mt-2">
                            <RefreshCw className="h-4 w-4" />
                            Riprova
                        </Button>
                    </Empty>
                )}

                {!loading && !error && printers.length === 0 && (
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>Nessuna stampante</EmptyTitle>
                            <EmptyDescription>Configura almeno una stampante nelle impostazioni.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}

                {!loading && !error && printers.map((p) => (
                    <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/5"
                    >
                        <Checkbox
                            checked={checked.has(p.id)}
                            onCheckedChange={(value) => toggle(p.id, value)}
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
            </div>

            <DialogFooter>
                {!required && (
                    <Button variant="outline" className="cursor-pointer" onClick={onCancel}>
                        Annulla
                    </Button>
                )}
                <Button className="cursor-pointer" disabled={selectedCount === 0} onClick={confirm}>
                    Conferma{selectedCount > 0 && ` (${selectedCount})`}
                </Button>
            </DialogFooter>
        </>
    )
}
