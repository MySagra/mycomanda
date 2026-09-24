"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { CheckCheck, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { PrinterSelector } from "@/components/commands/monitor/PrinterSelector"
import { usePrinterSelection } from "@/components/commands/monitor/PrinterSelectionContext"
import { patchOrderStatus } from "@/components/commands/monitor/serviceDayOrders"
import { CompletedOrderCard } from "./CompletedOrderCard"
import { useCompletedOrders } from "./useCompletedOrders"
import { useCardSize } from "@/hooks/use-card-size"

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
    const { t } = useTranslation()
    const { cardSizeStyle } = useCardSize()

    // Back to CONFIRMED: live monitors pick it up from the `order-status-update` event.
    async function restore(id: string) {
        try {
            await patchOrderStatus(id, "CONFIRMED")
            removeOrder(id)
            toast.success(t("completed.restoreSuccess"))
        } catch (err) {
            console.warn("[completed] restore failed", err)
            toast.error(t("completed.restoreError"))
        }
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b px-6 py-3">
                <div className="flex items-center gap-2">
                    <CheckCheck className="h-5 w-5 text-green-600 dark:text-green-500" />
                    <h2 className="text-lg font-semibold">{t("completed.title")}</h2>
                    {!loading && !error && <span className="text-sm text-muted-foreground">({orders.length})</span>}
                </div>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={reload} disabled={loading}>
                    <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    {t("common.refresh")}
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
                                <EmptyTitle>{t("common.error")}</EmptyTitle>
                                <EmptyDescription>{t(error)}</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-6">
                        <Empty>
                            <EmptyHeader>
                                <CheckCheck className="h-10 w-10 text-muted-foreground" />
                                <EmptyTitle>{t("completed.emptyTitle")}</EmptyTitle>
                                <EmptyDescription>
                                    {t("completed.emptyDescription")}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(var(--card-min-width,18rem),1fr))] items-start gap-4 p-6" style={cardSizeStyle}>
                        {/* Same columns as the live monitor: at least the card size from the settings, stretched to fill the row. */}
                        {orders.map((o) => (
                            <CompletedOrderCard key={o.id} order={o} printerIds={printerIds} onRestore={restore} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
