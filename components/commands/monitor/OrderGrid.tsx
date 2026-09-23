"use client"

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Utensils } from "lucide-react"
import { toast } from "sonner"
import { DraggableOrder } from "./DraggableOrder"
import { useOrderReorder } from "./useOrderReorder"
import type { SSEOrder } from "./types"

interface Props {
    orders: SSEOrder[]
    printerIds: string[]
    onCompleted: (id: string) => void
}

export function OrderGrid({ orders, printerIds, onCompleted }: Props) {
    const { pinned, unpinned, pinnedIds, move, togglePin } = useOrderReorder(orders)

    async function complete(id: string) {
        try {
            const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "COMPLETED" }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            onCompleted(id)
        } catch (err) {
            console.warn("[order] complete failed", err)
            toast.error("Impossibile completare l'ordine")
        }
    }

    function renderOrder(o: SSEOrder) {
        return (
            <DraggableOrder
                key={o.id}
                order={o}
                printerIds={printerIds}
                pinned={pinnedIds.has(o.id)}
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
        <div className="flex flex-col gap-4 p-6 pt-8">
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
        </div>
    )
}
