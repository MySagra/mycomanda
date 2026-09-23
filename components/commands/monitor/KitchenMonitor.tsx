"use client"

import { PrinterSelector } from "./PrinterSelector"
import { OrderGrid } from "./OrderGrid"
import { useOrderStream } from "./useOrderStream"
import { usePrinterSelection } from "./PrinterSelectionContext"
import { Spinner } from "@/components/ui/spinner"

export function KitchenMonitor() {
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
            {!required && <MonitorView printerIds={printerIds} />}
        </>
    )
}

function MonitorView({ printerIds }: { printerIds: string[] }) {
    const { orders, state, removeOrder } = useOrderStream({ channel: "ticket", printerIds })

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                {state === "loading" ? (
                    <div className="flex h-full items-center justify-center">
                        <Spinner />
                    </div>
                ) : (
                    <OrderGrid orders={orders} printerIds={printerIds} onCompleted={removeOrder} />
                )}
            </div>
        </div>
    )
}
