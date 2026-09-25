"use client"

import { Fragment, type MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { useDeviceType } from "@/hooks/use-device-type"
import { useCardSize } from "@/hooks/use-card-size"
import { useAutoCompletion } from "@/hooks/use-auto-completion"
import { Check, Utensils } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { DraggableOrder } from "./DraggableOrder"
import { OrderCard } from "./OrderCard"
import { EXIT_ANIMATION_MS, useOrderReorder } from "./useOrderReorder"
import { usePointerReorder } from "./usePointerReorder"
import { clearOrderState } from "./useMonitorState"
import { patchOrderStatus } from "./serviceDayOrders"
import type { SSEOrder } from "./types"

interface Props {
    orders: SSEOrder[]
    printerIds: string[]
    onCompleted: (id: string) => void
}

// Columns never narrower than a card's minimum width (set in the settings), as many as fit,
// stretched to fill the row. Pinned and regular rows share it, so they line up.
const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(var(--card-min-width,18rem),1fr))] items-start gap-x-4 gap-y-8"

export function OrderGrid({ orders, printerIds, onCompleted }: Props) {
    const { pinned, regular, completed, pinnedIds, leavingIds, move, togglePin, completeLocally } = useOrderReorder(orders)
    const { deviceType } = useDeviceType()
    const { cardSizeStyle } = useCardSize()
    const { autoCompletion } = useAutoCompletion()
    const { t } = useTranslation()
    const reorder = usePointerReorder({ mode: deviceType === "tablet" ? "touch" : "mouse", onMove: move })
    const ghostOrder = reorder.ghost && orders.find((o) => o.id === reorder.ghost?.id)

    async function complete(id: string) {
        // The server is left alone: the order only moves to the end of the list.
        if (!autoCompletion) {
            completeLocally(id)
            return
        }
        try {
            await patchOrderStatus(id, "COMPLETED")
            onCompleted(id)
            // After the exit animation, which still shows the ready dishes.
            setTimeout(() => clearOrderState(id), EXIT_ANIMATION_MS)
        } catch (err) {
            console.warn("[order] complete failed", err)
            toast.error(t("monitor.completeError"))
        }
    }

    // In reorder mode a tap on empty space ends it, as on iOS.
    function onGridClick(e: MouseEvent<HTMLDivElement>) {
        if (!reorder.reordering) return
        if ((e.target as HTMLElement).closest("[data-order-id]")) return
        reorder.exit()
    }

    function renderOrder(o: SSEOrder, index: number) {
        return (
            <DraggableOrder
                key={o.id}
                order={o}
                printerIds={printerIds}
                pinned={pinnedIds.has(o.id)}
                reordering={reorder.reordering}
                dragSource={reorder.ghost?.id === o.id}
                leaving={leavingIds.has(o.id)}
                index={index}
                onReorderPointerDown={(e) => reorder.onCardPointerDown(o.id, e)}
                onTogglePin={togglePin}
                onComplete={complete}
            />
        )
    }

    // Pinned orders first, then the regular ones, then the ones completed on this device only.
    // Fixed keys: a row must not remount, restarting its cards, when its first order changes.
    const rows = Object.entries({ pinned, regular, completed }).filter(([, row]) => row.length > 0)

    if (rows.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center p-6">
                <Empty>
                    <EmptyHeader>
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                        <EmptyTitle>{t("monitor.waitingTitle")}</EmptyTitle>
                        <EmptyDescription>
                            {t("monitor.waitingDescription")}
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </div>
        )
    }

    return (
        <div className="flex min-h-full flex-col gap-4 p-6 pt-8" style={cardSizeStyle} onClick={onGridClick}>
            {rows.map(([key, row], i) => (
                <Fragment key={key}>
                    {/* Extra room above: the round actions of the next row stick out of their cards. */}
                    {i > 0 && <Separator className="mt-2 mb-4 h-0.5 w-full rounded-full bg-primary/60" />}
                    <div className={GRID_CLASS}>
                        {row.map(renderOrder)}
                    </div>
                </Fragment>
            ))}

            {reorder.ghost && ghostOrder && (
                <div
                    className="pointer-events-none fixed z-50 scale-105 rotate-2 rounded-xl shadow-2xl"
                    style={{
                        left: reorder.ghost.x - reorder.ghost.offsetX,
                        top: reorder.ghost.y - reorder.ghost.offsetY,
                        width: reorder.ghost.width,
                    }}
                >
                    <OrderCard
                        order={ghostOrder}
                        printerIds={printerIds}
                        pinned={pinnedIds.has(ghostOrder.id)}
                        roomForActions={deviceType !== "tablet"}
                    />
                </div>
            )}

            {reorder.reordering && (
                <Button
                    className="fixed bottom-6 left-1/2 z-40 h-14 -translate-x-1/2 cursor-pointer gap-2 rounded-full px-8 text-lg shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4"
                    onClick={reorder.exit}
                >
                    <Check className="size-5" />
                    {t("monitor.done")}
                </Button>
            )}
        </div>
    )
}
