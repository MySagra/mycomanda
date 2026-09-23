"use client"

import { useState, type DragEvent, type PointerEvent } from "react"
import { Check, GripVertical, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useDeviceType } from "@/hooks/use-device-type"
import { cn } from "cn"
import { OrderCard } from "./OrderCard"
import { OrderActionsOverlay } from "./OrderActionsOverlay"
import type { SSEOrder } from "./types"

const MIME = "application/x-order-id"

interface Props {
    order: SSEOrder
    printerIds: string[]
    pinned: boolean
    // Tablet reorder mode: every card wobbles and a tap no longer opens the actions.
    reordering: boolean
    // This card is picked up: a ghost follows the finger, the card stays as a placeholder.
    dragSource: boolean
    // Position in the grid, used to desync the wobble between neighbours.
    index: number
    onTouchPointerDown: (e: PointerEvent<HTMLDivElement>) => void
    onMove: (fromId: string, toId: string) => void
    onTogglePin: (id: string) => void
    onComplete: (id: string) => Promise<void>
}

export function DraggableOrder({
    order,
    printerIds,
    pinned,
    reordering,
    dragSource,
    index,
    onTouchPointerDown,
    onMove,
    onTogglePin,
    onComplete,
}: Props) {
    const [dragging, setDragging] = useState(false)
    const [over, setOver] = useState(false)
    const [completing, setCompleting] = useState(false)
    const [actionsOpen, setActionsOpen] = useState(false)
    const { deviceType } = useDeviceType()
    // Touch screens have no hover: on tablets a tap on the card opens the
    // actions full screen instead of the round buttons on the card edge.
    const isTablet = deviceType === "tablet"
    const hoverOnly = "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
    // Solid colours on hover too: the stock variants fade to translucent ones,
    // which let the card border show through the button.
    const actionClass = "size-11 cursor-pointer rounded-full border-2 shadow-lg [&_svg:not([class*='size-'])]:size-5"

    async function complete() {
        setCompleting(true)
        try {
            await onComplete(order.id)
        } finally {
            setCompleting(false)
        }
    }

    function onDragStart(e: DragEvent<HTMLDivElement>) {
        e.dataTransfer.setData(MIME, order.id)
        e.dataTransfer.setData("text/plain", order.id)
        e.dataTransfer.effectAllowed = "move"
        setDragging(true)
    }

    function onDragEnd() {
        setDragging(false)
        setOver(false)
    }

    function onDragOver(e: DragEvent<HTMLDivElement>) {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = "move"
        if (!dragging && !over) setOver(true)
    }

    function onDragEnter(e: DragEvent<HTMLDivElement>) {
        e.preventDefault()
        if (!dragging) setOver(true)
    }

    function onDragLeave(e: DragEvent<HTMLDivElement>) {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setOver(false)
    }

    function onDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault()
        e.stopPropagation()
        setOver(false)
        const fromId = e.dataTransfer.getData(MIME) || e.dataTransfer.getData("text/plain")
        if (!fromId) return
        onMove(fromId, order.id)
    }

    return (
        <>
            <div
                data-order-id={order.id}
                // Tablets reorder with the long press below; native drag would clash with it.
                draggable={!isTablet}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onPointerDown={isTablet ? onTouchPointerDown : undefined}
                // Long press would otherwise open the system context menu.
                onContextMenu={isTablet ? (e) => e.preventDefault() : undefined}
                onClick={isTablet && !reordering ? () => setActionsOpen(true) : undefined}
                style={
                    reordering
                        ? {
                              animationDelay: `${-(index % 4) * 70}ms`,
                              animationDirection: index % 2 ? "reverse" : "normal",
                          }
                        : undefined
                }
                className={cn(
                    "relative group w-fit max-w-sm select-none transition-opacity",
                    isTablet ? "[-webkit-touch-callout:none]" : "cursor-grab active:cursor-grabbing",
                    reordering && "touch-none motion-safe:animate-jiggle",
                    (dragging || dragSource) && "opacity-30",
                    over && "ring-2 ring-primary rounded-xl",
                )}
            >
                {!isTablet && (
                    <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-1 ring-border opacity-0 group-hover:opacity-100 pointer-events-none">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                )}
                {/* Round actions straddling the card's top edge, above the card. */}
                {!isTablet && (
                    <div className="absolute top-0 right-3 z-20 flex -translate-y-1/2 gap-2">
                        <Button
                            variant={pinned ? "default" : "outline"}
                            className={cn(
                                actionClass,
                                // A pinned order keeps its pin visible as a status marker.
                                !pinned && hoverOnly,
                                pinned
                                    ? "border-primary hover:bg-primary"
                                    : "bg-background hover:bg-secondary dark:bg-secondary dark:hover:bg-secondary dark:hover:brightness-125",
                            )}
                            onClick={() => onTogglePin(order.id)}
                            aria-label={pinned ? "Rimuovi fissaggio" : "Fissa in alto"}
                            title={pinned ? "Rimuovi fissaggio" : "Fissa in alto"}
                        >
                            <Pin className={cn("size-5", pinned && "fill-current")} />
                        </Button>
                        <Button
                            variant="outline"
                            className={cn(
                                actionClass,
                                !completing && hoverOnly,
                                "bg-background text-green-600 hover:bg-secondary hover:text-green-600 dark:bg-secondary dark:text-green-500 dark:hover:bg-secondary dark:hover:brightness-125 dark:hover:text-green-500",
                            )}
                            onClick={complete}
                            disabled={completing}
                            aria-label="Completa ordine"
                            title="Completa ordine"
                        >
                            {completing ? <Spinner /> : <Check />}
                        </Button>
                    </div>
                )}
                <OrderCard order={order} printerIds={printerIds} pinned={pinned} interactive={!reordering} />
            </div>
            {/* Outside the card: React events bubble through portals, so a tap
                inside the overlay would otherwise reach the card and reopen it. */}
            {isTablet && (
                <OrderActionsOverlay
                    order={order}
                    open={actionsOpen}
                    pinned={pinned}
                    completing={completing}
                    onOpenChange={setActionsOpen}
                    onTogglePin={() => {
                        onTogglePin(order.id)
                        setActionsOpen(false)
                    }}
                    onComplete={complete}
                />
            )}
        </>
    )
}
