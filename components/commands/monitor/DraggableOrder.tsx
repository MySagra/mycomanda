"use client"

import { useEffect, useEffectEvent, useState, type PointerEvent } from "react"
import { Check, GripVertical, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useDeviceType } from "@/hooks/use-device-type"
import { cn } from "cn"
import { OrderCard } from "./OrderCard"
import { OrderActionsOverlay } from "./OrderActionsOverlay"
import { CountdownBorder } from "./CountdownBorder"
import { EXIT_ANIMATION_MS } from "./useOrderReorder"
import { useItemProgress, useLocallyCompletedOrders } from "./useMonitorState"
import type { SSEOrder } from "./types"
import { useTranslation } from "react-i18next"

// Grace period between the last dish marked ready and the automatic completion,
// long enough to undo a mistaken tap.
const AUTO_COMPLETE_MS = 5_000

interface Props {
    order: SSEOrder
    printerIds: string[]
    pinned: boolean
    // Tablet reorder mode: every card wobbles and a tap no longer opens the actions.
    reordering: boolean
    // This card is picked up: a ghost follows the pointer, the card stays as a placeholder.
    dragSource: boolean
    // The order left the list: the card fades out, then the grid drops it.
    leaving: boolean
    // Position in the grid, used to desync the wobble between neighbours.
    index: number
    onReorderPointerDown: (e: PointerEvent<HTMLDivElement>) => void
    onTogglePin: (id: string) => void
    onComplete: (id: string) => Promise<void>
}

export function DraggableOrder({
    order,
    printerIds,
    pinned,
    reordering,
    dragSource,
    leaving,
    index,
    onReorderPointerDown,
    onTogglePin,
    onComplete,
}: Props) {
    const [completing, setCompleting] = useState(false)
    const [actionsOpen, setActionsOpen] = useState(false)
    const { deviceType } = useDeviceType()
    const { t } = useTranslation()
    // Touch screens have no hover: on tablets a tap on the card opens the
    // actions full screen instead of the round buttons on the card edge.
    const isTablet = deviceType === "tablet"
    // Shown on hover. A screen that cannot hover (a tablet left in desktop mode)
    // shows them all the time, or they could never be reached.
    const hoverOnly =
        "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
    // Solid colours on hover too: the stock variants fade to translucent ones,
    // which let the card border show through the button.
    const actionClass = "size-11 cursor-pointer rounded-full border-2 shadow-lg [&_svg:not([class*='size-'])]:size-5"

    // Every dish this monitor shows is ready: the card turns green and the order
    // completes by itself unless a dish is reset first.
    const progress = useItemProgress()
    const items = order.orderItems.filter((it) => it.food?.printerId != null && printerIds.includes(it.food.printerId))
    const allReady = items.length > 0 && items.every((it) => (progress[it.id]?.completed ?? 0) >= it.quantity)
    // An order completed on this device only already sits in the completed
    // row: completing it again would only move it within that row.
    const completedLocally = !!useLocallyCompletedOrders()[order.id]
    const countingDown = allReady && !completedLocally

    const autoComplete = useEffectEvent(() => {
        if (!completing && !leaving) complete()
    })

    useEffect(() => {
        if (!countingDown) return
        const timer = setTimeout(autoComplete, AUTO_COMPLETE_MS)
        return () => clearTimeout(timer)
    }, [countingDown])

    async function complete() {
        setCompleting(true)
        try {
            await onComplete(order.id)
        } finally {
            setCompleting(false)
        }
    }

    return (
        <>
            <div
                data-order-id={order.id}
                onPointerDown={onReorderPointerDown}
                // Long press would otherwise open the system context menu.
                onContextMenu={isTablet ? (e) => e.preventDefault() : undefined}
                onClick={isTablet && !reordering ? () => setActionsOpen(true) : undefined}
                style={
                    leaving
                        ? { animationDuration: `${EXIT_ANIMATION_MS}ms` }
                        : reordering
                          ? {
                                animationDelay: `${-(index % 4) * 70}ms`,
                                animationDirection: index % 2 ? "reverse" : "normal",
                            }
                          : undefined
                }
                className={cn(
                    "relative group w-full select-none transition-opacity",
                    isTablet ? "[-webkit-touch-callout:none]" : "cursor-grab active:cursor-grabbing",
                    reordering && !leaving && "touch-none motion-safe:animate-jiggle",
                    dragSource && "opacity-30",
                    leaving && "pointer-events-none animate-out fade-out-0 zoom-out-90 fill-mode-forwards",
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
                            aria-label={pinned ? t("monitor.unpin") : t("monitor.pin")}
                            title={pinned ? t("monitor.unpin") : t("monitor.pin")}
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
                            aria-label={t("monitor.completeOrder")}
                            title={t("monitor.completeOrder")}
                        >
                            {completing ? <Spinner /> : <Check />}
                        </Button>
                    </div>
                )}
                <OrderCard
                    order={order}
                    printerIds={printerIds}
                    pinned={pinned}
                    ready={allReady}
                    interactive={!reordering}
                    roomForActions={!isTablet}
                />
                {/* Mounted when the order becomes ready, so the countdown restarts with the timer. */}
                {countingDown && (
                    <CountdownBorder
                        // The card's rounded-xl: --radius (0.65rem) + 4px.
                        radius={14.4}
                        className="animate-border-drain"
                        style={{ animationDuration: `${AUTO_COMPLETE_MS}ms` }}
                    />
                )}
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
