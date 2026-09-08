"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Printer as PrinterIcon, RefreshCw } from "lucide-react"
import type { Printer } from "./types"

interface Props {
    onSelect: (printer: Printer) => void
}

export function PrinterSelector({ onSelect }: Props) {
    const [printers, setPrinters] = useState<Printer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PrinterIcon className="h-5 w-5" />
                        Seleziona stampante
                    </CardTitle>
                    <CardDescription>
                        Scegli la stampante da monitorare. Verranno mostrate solo le comande destinate a questa stampante.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
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
                        <Button
                            key={p.id}
                            variant="outline"
                            className="h-auto justify-between px-4 py-3 cursor-pointer"
                            onClick={() => onSelect(p)}
                        >
                            <span className="flex flex-col items-start gap-0.5">
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
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
