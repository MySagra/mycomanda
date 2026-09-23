"use client"

import type { MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { useDeviceType } from "@/hooks/use-device-type"
import { Check, Utensils } from "lucide-react"
import { toast } from "sonner"
import { DraggableOrder } from "./DraggableOrder"
import { OrderCard } from "./OrderCard"
import { useOrderReorder } from "./useOrderReorder"
import { usePointerReorder } from "./usePointerReorder"
import { clearOrderState } from "./useMonitorState"
import type { SSEOrder } from "./types"

interface Props {
    orders: SSEOrder[]
    printerIds: string[]
    onCompleted: (id: string) => void
}

export function OrderGrid({ orders, printerIds, onCompleted }: Props) {
    const { pinned, unpinned, pinnedIds, move, togglePin } = useOrderReorder(orders)
    const { deviceType } = useDeviceType()
    const reorder = usePointerReorder({ mode: deviceType === "tablet" ? "touch" : "mouse", onMove: move })
    const ghostOrder = reorder.ghost && orders.find((o) => o.id === reorder.ghost?.id)

    async function complete(id: string) {
        try {
            const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "COMPLETED" }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            clearOrderState(id)
            onCompleted(id)
        } catch (err) {
            console.warn("[order] complete failed", err)
            toast.error("Impossibile completare l'ordine")
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
                index={index}
                onReorderPointerDown={(e) => reorder.onCardPointerDown(o.id, e)}
                onTogglePin={togglePin}
                onComplete={complete}
            />
        )
    }

    if (pinned.length === 0 && unpinned.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center p-6">
                <Empty>
                    <EmptyHeader>
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                        <EmptyTitle>In attesa di comande</EmptyTitle>
                        <EmptyDescription>
                            Le nuove comande destinate alle stampanti selezionate appariranno qui.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </div>
        )
    }

    return (
        <div className="flex min-h-full flex-col gap-4 p-6 pt-8" onClick={onGridClick}>
            {pinned.length > 0 && (
                <>
                    <div className="flex flex-wrap items-start content-start gap-x-4 gap-y-8">
                        {pinned.map(renderOrder)}
                    </div>
                    {/* Extra room above: the round actions of the next row stick out of their cards. */}
                    {unpinned.length > 0 && <Separator className="mt-2 mb-4 h-0.5 w-full rounded-full bg-primary/60" />}
                </>
            )}
            {unpinned.length > 0 && (
                <div className="flex flex-wrap items-start content-start gap-x-4 gap-y-8">
                    {unpinned.map(renderOrder)}
                </div>
            )}

            {reorder.ghost && ghostOrder && (
                <div
                    className="pointer-events-none fixed z-50 scale-105 rotate-2 rounded-xl shadow-2xl"
                    style={{
                        left: reorder.ghost.x - reorder.ghost.offsetX,
                        top: reorder.ghost.y - reorder.ghost.offsetY,
                        width: reorder.ghost.width,
                    }}
                >
                    <OrderCard order={ghostOrder} printerIds={printerIds} pinned={pinnedIds.has(ghostOrder.id)} />
                </div>
            )}

            {reorder.reordering && (
                <Button
                    className="fixed bottom-6 left-1/2 z-40 h-14 -translate-x-1/2 cursor-pointer gap-2 rounded-full px-8 text-lg shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4"
                    onClick={reorder.exit}
                >
                    <Check className="size-5" />
                    Fine
                </Button>
            )}
        </div>
    )
}
