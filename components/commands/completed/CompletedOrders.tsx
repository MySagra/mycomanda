"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { CheckCheck, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { PrinterSelector } from "@/components/commands/monitor/PrinterSelector"
import { usePrinterSelection } from "@/components/commands/monitor/PrinterSelectionContext"
import { patchOrderStatus } from "@/components/commands/monitor/serviceDayOrders"
import { CompletedOrderCard } from "./CompletedOrderCard"
import { useCompletedOrders } from "./useCompletedOrders"

export function CompletedOrders() {
    const { printers, hydrated, select, dialogOpen, setDialogOpen } = usePrinterSelection()

    if (!hydrated) return null

    const printerIds = printers.map((p) => p.id)
    const required = printerIds.length === 0

    return (
        <>
            <PrinterSelector
                open={dialogOpen || required}
                required={required}
                selectedIds={printerIds}
                onOpenChange={setDialogOpen}
                onConfirm={select}
            />
            {!required && <CompletedList printerIds={printerIds} />}
        </>
    )
}

function CompletedList({ printerIds }: { printerIds: string[] }) {
    const { orders, loading, error, reload, removeOrder } = useCompletedOrders(printerIds)

    // Back to CONFIRMED: live monitors pick it up from the `order-status-update` event.
    async function restore(id: string) {
        try {
            await patchOrderStatus(id, "CONFIRMED")
            removeOrder(id)
            toast.success("Ordine riportato in lavorazione")
        } catch (err) {
            console.warn("[completed] restore failed", err)
            toast.error("Impossibile riportare l'ordine in lavorazione")
        }
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b px-6 py-3">
                <div className="flex items-center gap-2">
                    <CheckCheck className="h-5 w-5 text-green-600 dark:text-green-500" />
                    <h2 className="text-lg font-semibold">Ordini completati</h2>
                    {!loading && !error && <span className="text-sm text-muted-foreground">({orders.length})</span>}
                </div>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={reload} disabled={loading}>
                    <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    Aggiorna
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading && orders.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <Spinner />
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center p-6">
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>Errore</EmptyTitle>
                                <EmptyDescription>{error}</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-6">
                        <Empty>
                            <EmptyHeader>
                                <CheckCheck className="h-10 w-10 text-muted-foreground" />
                                <EmptyTitle>Nessun ordine completato</EmptyTitle>
                                <EmptyDescription>
                                    Gli ordini completati oggi per le stampanti selezionate appariranno qui.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-start content-start gap-4 p-6">
                        {orders.map((o) => (
                            <CompletedOrderCard key={o.id} order={o} printerIds={printerIds} onRestore={restore} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
