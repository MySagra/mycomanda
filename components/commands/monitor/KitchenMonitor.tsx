"use client"

import { PrinterSelector } from "./PrinterSelector"
import { OrderGrid } from "./OrderGrid"
import { useOrderStream } from "./useOrderStream"
import { usePrinterSelection } from "./PrinterSelectionContext"
import { Spinner } from "@/components/ui/spinner"

export function KitchenMonitor() {
    const { printer, hydrated, select } = usePrinterSelection()

    if (!hydrated) return null

    if (!printer) {
        return <PrinterSelector onSelect={select} />
    }

    return <MonitorView printerId={printer.id} />
}

function MonitorView({ printerId }: { printerId: string }) {
    const { orders, state } = useOrderStream({ channel: "printer", printerId })

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                {state === "loading" ? (
                    <div className="flex h-full items-center justify-center">
                        <Spinner />
                    </div>
                ) : (
                    <OrderGrid orders={orders} printerId={printerId} />
                )}
            </div>
        </div>
    )
}
