"use client"

import type { MouseEvent } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Check, Hash, Pin, X } from "lucide-react"
import { cn } from "cn"
import type { SSEOrder } from "./types"

interface Props {
    order: SSEOrder
    open: boolean
    pinned: boolean
    completing: boolean
    onOpenChange: (open: boolean) => void
    onTogglePin: () => void
    onComplete: () => void
}

// Each block enters on its own, a little after the previous one; `fill-mode-both`
// keeps it hidden during its delay.
const enter = "animate-in fade-in-0 fill-mode-both duration-300 ease-out"

/**
 * Tablet replacement for the hover buttons: tapping a card opens its actions
 * over the monitor, with targets big enough for a finger.
 */
export function OrderActionsOverlay({ order, open, pinned, completing, onOpenChange, onTogglePin, onComplete }: Props) {
    // The popup covers the whole screen, so the backdrop never receives taps:
    // any tap that does not land on a button counts as a tap outside.
    function onPopupClick(e: MouseEvent<HTMLDivElement>) {
        if (completing) return
        if ((e.target as HTMLElement).closest("button")) return
        onOpenChange(false)
    }

    return (
        <DialogPrimitive.Root open={open} onOpenChange={(next) => !completing && onOpenChange(next)}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-closed:duration-150" />
                <DialogPrimitive.Popup
                    onClick={onPopupClick}
                    className="fixed inset-0 z-50 flex flex-col gap-6 p-10 outline-none sm:p-16 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:duration-150"
                >
                    <div className={cn(enter, "slide-in-from-top-4 flex flex-col items-center gap-2 text-center text-white")}>
                        <DialogPrimitive.Title className="flex items-center gap-2 text-3xl font-bold">
                            <Hash className="size-7" />
                            {order.displayCode}
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Description className="text-base text-white/80">
                            {[order.ticketNumber != null && `Comanda #${order.ticketNumber}`, order.table, order.customer]
                                .filter(Boolean)
                                .join(" · ")}
                        </DialogPrimitive.Description>
                    </div>

                    <div className="grid flex-1 grid-cols-2 gap-6">
                        <Button
                            variant={pinned ? "default" : "outline"}
                            className={cn(
                                enter,
                                "zoom-in-90 delay-75 h-full cursor-pointer flex-col gap-4 rounded-2xl border-2 text-2xl shadow-2xl",
                                !pinned && "bg-background dark:bg-secondary dark:hover:bg-secondary dark:hover:brightness-125",
                            )}
                            onClick={onTogglePin}
                            disabled={completing}
                        >
                            <Pin className={cn("size-16", pinned && "fill-current")} />
                            {pinned ? "Rimuovi fissaggio" : "Fissa in alto"}
                        </Button>
                        <Button
                            className={cn(
                                enter,
                                "zoom-in-90 delay-150 h-full cursor-pointer flex-col gap-4 rounded-2xl border-2 bg-green-600 text-2xl text-white shadow-2xl hover:bg-green-700",
                            )}
                            onClick={onComplete}
                            disabled={completing}
                        >
                            {completing ? <Spinner className="size-16" /> : <Check className="size-16" />}
                            Completa
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        className={cn(
                            enter,
                            "slide-in-from-bottom-6 delay-200 h-24 cursor-pointer gap-3 rounded-2xl border-2 bg-background text-2xl shadow-2xl dark:bg-secondary dark:hover:bg-secondary dark:hover:brightness-125",
                        )}
                        onClick={() => onOpenChange(false)}
                        disabled={completing}
                    >
                        <X className="size-8" />
                        Annulla
                    </Button>
                </DialogPrimitive.Popup>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
