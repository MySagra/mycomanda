"use client"

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Utensils } from "lucide-react"
import { DraggableOrder } from "./DraggableOrder"
import { useOrderReorder } from "./useOrderReorder"
import type { SSEOrder } from "./types"

interface Props {
    orders: SSEOrder[]
    printerId: string
}

export function OrderGrid({ orders, printerId }: Props) {
    const { ordered, move } = useOrderReorder(orders)

    if (ordered.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center p-6">
                <Empty>
                    <EmptyHeader>
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                        <EmptyTitle>In attesa di comande</EmptyTitle>
                        <EmptyDescription>
                            Le nuove comande destinate a questa stampante appariranno qui.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </div>
        )
    }

    return (
        <div className="flex flex-wrap items-start content-start gap-4 p-6">
            {ordered.map((o) => (
                <DraggableOrder key={o.id} order={o} printerId={printerId} onMove={move} />
            ))}
        </div>
    )
}
