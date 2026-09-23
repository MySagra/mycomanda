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
import { useTouchReorder } from "./useTouchReorder"
import { clearOrderProgress } from "./useItemProgress"
import type { SSEOrder } from "./types"

interface Props {
    orders: SSEOrder[]
    printerIds: string[]
    onCompleted: (id: string) => void
}

export function OrderGrid({ orders, printerIds, onCompleted }: Props) {
    const { pinned, unpinned, pinnedIds, move, togglePin } = useOrderReorder(orders)
    const { deviceType } = useDeviceType()
    const touch = useTouchReorder({ enabled: deviceType === "tablet", onMove: move })
    const ghostOrder = touch.ghost && orders.find((o) => o.id === touch.ghost?.id)

    async function complete(id: string) {
        try {
            const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "COMPLETED" }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            clearOrderProgress(id)
            onCompleted(id)
        } catch (err) {
            console.warn("[order] complete failed", err)
            toast.error("Impossibile completare l'ordine")
        }
    }

    // In reorder mode a tap on empty space ends it, as on iOS.
    function onGridClick(e: MouseEvent<HTMLDivElement>) {
        if (!touch.reordering) return
        if ((e.target as HTMLElement).closest("[data-order-id]")) return
        touch.exit()
    }

    function renderOrder(o: SSEOrder, index: number) {
        return (
            <DraggableOrder
                key={o.id}
                order={o}
                printerIds={printerIds}
                pinned={pinnedIds.has(o.id)}
                reordering={touch.reordering}
                dragSource={touch.ghost?.id === o.id}
                index={index}
                onTouchPointerDown={(e) => touch.onCardPointerDown(o.id, e)}
                onMove={move}
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
                    {unpinned.length > 0 && <Separator />}
                </>
            )}
            {unpinned.length > 0 && (
                <div className="flex flex-wrap items-start content-start gap-x-4 gap-y-8">
                    {unpinned.map(renderOrder)}
                </div>
            )}

            {touch.ghost && ghostOrder && (
                <div
                    className="pointer-events-none fixed z-50 scale-105 rotate-2 rounded-xl shadow-2xl"
                    style={{
                        left: touch.ghost.x - touch.ghost.offsetX,
                        top: touch.ghost.y - touch.ghost.offsetY,
                        width: touch.ghost.width,
                    }}
                >
                    <OrderCard order={ghostOrder} printerIds={printerIds} pinned={pinnedIds.has(ghostOrder.id)} />
                </div>
            )}

            {touch.reordering && (
                <Button
                    className="fixed bottom-6 left-1/2 z-40 h-14 -translate-x-1/2 cursor-pointer gap-2 rounded-full px-8 text-lg shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4"
                    onClick={touch.exit}
                >
                    <Check className="size-5" />
                    Fine
                </Button>
            )}
        </div>
    )
}
