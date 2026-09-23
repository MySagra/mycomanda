"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { KeyboardEvent, MouseEvent } from "react"
import { Check, Clock, Hash, User, Utensils } from "lucide-react"
import { cn } from "cn"
import { advanceItem, useItemProgress } from "./useMonitorState"
import type { SSEOrder, SSEOrderItem } from "./types"

interface Props {
    order: SSEOrder
    printerIds: string[]
    pinned: boolean
    // Every dish is ready and the order is about to complete itself. The card
    // shows a faint green track; DraggableOrder draws the countdown over it.
    ready?: boolean
    // Dish rows respond to taps. Off for the drag ghost and in reorder mode.
    interactive?: boolean
    // Extra space above the header for the round actions that straddle the top
    // edge on desktop, so they do not cover the time.
    roomForActions?: boolean
}

function formatTime(iso: string) {
    try {
        const d = new Date(iso)
        return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    } catch {
        return iso
    }
}

export function OrderCard({ order, printerIds, pinned, ready = false, interactive = false, roomForActions = false }: Props) {
    const progress = useItemProgress()
    const items = order.orderItems.filter((it) => it.food?.printerId != null && printerIds.includes(it.food.printerId))
    if (items.length === 0) return null

    return (
        <Card
            className={cn(
                "min-w-72 w-full transition-shadow",
                pinned && "ring-2 ring-primary",
                ready && "ring-2 ring-green-600/25 dark:ring-green-500/25",
            )}
        >
            <CardHeader className={cn("gap-2", roomForActions && "pt-4")}>
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
                    <OrderItemRow
                        key={it.id}
                        item={it}
                        completed={Math.min(progress[it.id]?.completed ?? 0, it.quantity)}
                        onAdvance={interactive ? () => advanceItem(order.id, it) : undefined}
                    />
                ))}
            </CardContent>
        </Card>
    )
}

interface RowProps {
    item: SSEOrderItem
    completed: number
    onAdvance?: () => void
}

// The row itself is the progress bar: its background fills one portion per tap.
function OrderItemRow({ item, completed, onAdvance }: RowProps) {
    const done = completed >= item.quantity
    const percent = (completed / item.quantity) * 100

    function advance(e: MouseEvent | KeyboardEvent) {
        // On tablets a tap on the card opens the order actions; a tap on a dish must not.
        e.stopPropagation()
        onAdvance?.()
    }

    return (
        <div
            role={onAdvance ? "button" : undefined}
            tabIndex={onAdvance ? 0 : undefined}
            aria-label={onAdvance ? `${item.food?.name ?? "Piatto"}: ${completed} di ${item.quantity} pronti` : undefined}
            onClick={onAdvance ? advance : undefined}
            onKeyDown={
                onAdvance
                    ? (e) => {
                          if (e.key !== "Enter" && e.key !== " ") return
                          e.preventDefault()
                          advance(e)
                      }
                    : undefined
            }
            className={cn(
                "relative flex flex-col gap-1 overflow-hidden rounded-md bg-muted/50 px-3 py-2 transition-colors",
                onAdvance && "cursor-pointer hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                done && "ring-1 ring-green-600/50",
            )}
        >
            <div
                aria-hidden
                className={cn(
                    "absolute inset-y-0 left-0 transition-[width] duration-300 ease-out",
                    done ? "bg-green-600/30" : "bg-green-600/20",
                )}
                style={{ width: `${percent}%` }}
            />
            <div className="relative flex items-baseline gap-2">
                <span className="text-lg font-bold tabular-nums">{item.quantity}×</span>
                <span className={cn("text-base font-medium flex-1", done && "text-muted-foreground line-through")}>
                    {item.food?.name ?? "—"}
                </span>
                {done ? (
                    <Check className="size-5 self-center text-green-600 dark:text-green-500" />
                ) : (
                    item.quantity > 1 && (
                        <span className="text-sm font-medium tabular-nums text-muted-foreground">
                            {completed}/{item.quantity}
                        </span>
                    )
                )}
            </div>
            {item.notes && (
                <div className="relative text-sm text-muted-foreground italic pl-7">
                    {item.notes}
                </div>
            )}
        </div>
    )
}
