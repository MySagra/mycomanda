"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Hash, User, Utensils } from "lucide-react"
import { cn } from "cn"
import type { SSEOrder, SSEOrderItem } from "./types"

interface Props {
    order: SSEOrder
    printerIds: string[]
    pinned: boolean
}

function formatTime(iso: string) {
    try {
        const d = new Date(iso)
        return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    } catch {
        return iso
    }
}

export function OrderCard({ order, printerIds, pinned }: Props) {
    const items = order.orderItems.filter((it) => it.food?.printerId != null && printerIds.includes(it.food.printerId))
    if (items.length === 0) return null

    return (
        <Card className={cn("min-w-72 w-fit", pinned && "ring-2 ring-primary")}>
            <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-base px-2.5 py-0.5">
                            <Hash className="h-3.5 w-3.5" />
                            {order.displayCode}
                        </Badge>
                        {order.ticketNumber != null && (
                            <Badge variant="secondary">#{order.ticketNumber}</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatTime(order.confirmedAt ?? order.createdAt)}
                    </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {order.table && (
                        <div className="flex items-center gap-1">
                            <Utensils className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{order.table}</span>
                        </div>
                    )}
                    {order.customer && (
                        <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{order.customer}</span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-2">
                {items.map((it) => (
                    <OrderItemRow key={it.id} item={it} />
                ))}
            </CardContent>
        </Card>
    )
}

function OrderItemRow({ item }: { item: SSEOrderItem }) {
    return (
        <div className="flex flex-col gap-1 rounded-md bg-muted/50 px-3 py-2">
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tabular-nums">{item.quantity}×</span>
                <span className="text-base font-medium flex-1">{item.food?.name ?? "—"}</span>
            </div>
            {item.notes && (
                <div className="text-sm text-muted-foreground italic pl-7">
                    {item.notes}
                </div>
            )}
        </div>
    )
}
