"use client"

import type { ReactNode } from "react"
import { Check, CheckCheck, Hash, MousePointer2, Pin, Pointer, Printer, RefreshCw, Undo2, X } from "lucide-react"
import { cn } from "cn"
import { useTranslation } from "react-i18next"
import { CountdownBorder } from "@/components/commands/monitor/CountdownBorder"

// Small looping mock-ups of the monitor, drawn with the app's own tokens so
// they follow the light and dark theme. The motion lives in globals.css.

// The mock-up is drawn small and scaled up, so the text sizes stay readable
// and in proportion; `overlay` sits on top of the whole frame, unscaled.
function Frame({ children, className, overlay }: { children: ReactNode; className?: string; overlay?: ReactNode }) {
    return (
        <div
            aria-hidden
            className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl border bg-muted/40 select-none"
        >
            <div className={cn("flex scale-[1.35] items-center justify-center", className)}>{children}</div>
            {overlay}
        </div>
    )
}

function MiniCard({
    code,
    children,
    className,
}: {
    code: string
    children?: ReactNode
    className?: string
}) {
    return (
        <div className={cn("relative w-28 rounded-lg border bg-background p-2 shadow-sm", className)}>
            <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-0.5 rounded bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                    <Hash className="size-2" />
                    {code}
                </span>
                <span className="text-[8px] text-muted-foreground">20:15</span>
            </div>
            {children ?? <MiniRow label="1× Pizza" />}
        </div>
    )
}

function MiniRow({ label, fill, done }: { label: string; fill?: boolean; done?: boolean }) {
    return (
        <div className="relative mt-1 overflow-hidden rounded bg-muted px-1.5 py-1 text-[9px] font-medium">
            {fill && <div className="absolute inset-y-0 left-0 bg-green-600/40 motion-safe:animate-guide-fill" />}
            {done && <div className="absolute inset-0 bg-green-600/40" />}
            <span className={cn("relative", done && "text-muted-foreground line-through")}>{label}</span>
            {done && <Check className="absolute top-1/2 right-1 size-2.5 -translate-y-1/2 text-green-600" />}
        </div>
    )
}

function Cursor({ touch, className }: { touch: boolean; className?: string }) {
    const Icon = touch ? Pointer : MousePointer2
    return (
        <Icon
            className={cn(
                "absolute size-6 fill-background text-foreground drop-shadow",
                touch ? "" : "fill-foreground text-background",
                className,
            )}
        />
    )
}

/** Tapping a dish fills its row, one portion per tap. */
export function DishProgressIllustration({ touch }: { touch: boolean }) {
    const { t } = useTranslation()
    return (
        <Frame>
            <div className="relative">
                <MiniCard code="ABC" className="w-40">
                    <MiniRow label="2× Margherita" fill />
                    <MiniRow label={`1× ${t("guide.sampleFries")}`} />
                </MiniCard>
                <Cursor touch={touch} className="top-9 left-24 motion-safe:animate-guide-tap" />
            </div>
        </Frame>
    )
}

/** Every dish ready: the green border drains, then the order completes itself. */
export function AutoCompleteIllustration() {
    const { t } = useTranslation()
    return (
        <Frame>
            <div className="relative">
                <MiniCard code="ABC" className="w-40 ring-2 ring-green-600/25">
                    <MiniRow label="2× Margherita" done />
                    <MiniRow label={`1× ${t("guide.sampleFries")}`} done />
                </MiniCard>
                {/* MiniCard is rounded-lg: --radius (0.65rem). */}
                <CountdownBorder radius={10.4} className="motion-safe:animate-guide-drain" />
            </div>
        </Frame>
    )
}

/** Desktop: hovering a card shows the round pin and complete buttons. */
export function HoverActionsIllustration() {
    return (
        <Frame>
            <div className="relative">
                <MiniCard code="ABC" className="w-40">
                    <MiniRow label="2× Margherita" />
                </MiniCard>
                <div className="absolute -top-3.5 right-2 flex gap-1.5 motion-safe:animate-guide-reveal">
                    <span className="flex size-7 items-center justify-center rounded-full border-2 bg-background shadow-md">
                        <Pin className="size-3.5" />
                    </span>
                    <span className="flex size-7 items-center justify-center rounded-full border-2 bg-background text-green-600 shadow-md">
                        <Check className="size-3.5" />
                    </span>
                </div>
                <Cursor touch={false} className="top-10 left-20" />
            </div>
        </Frame>
    )
}

/** Tablet: tapping a card opens the full-screen actions. */
export function TapActionsIllustration() {
    const { t } = useTranslation()
    return (
        <Frame
            overlay={
                <div className="absolute inset-3 flex flex-col gap-2 rounded-lg bg-black/70 p-3 backdrop-blur-[1px] motion-safe:animate-guide-reveal">
                    <div className="grid flex-1 grid-cols-2 gap-2">
                        <span className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background text-xs font-medium">
                            <Pin className="size-5" />
                            {t("guide.samplePin")}
                        </span>
                        <span className="flex flex-col items-center justify-center gap-1 rounded-md bg-green-600 text-xs font-medium text-white">
                            <Check className="size-5" />
                            {t("monitor.complete")}
                        </span>
                    </div>
                    <span className="flex items-center justify-center gap-1 rounded-md border bg-background py-1.5 text-xs font-medium">
                        <X className="size-3.5" />
                        {t("common.cancel")}
                    </span>
                </div>
            }
        >
            <div className="relative">
                <MiniCard code="ABC" className="w-40">
                    <MiniRow label="2× Margherita" />
                </MiniCard>
                {/* On the card header, not on a dish: a tap on a dish marks it ready. */}
                <Cursor touch className="-top-0.5 left-[4.5rem] motion-safe:animate-guide-tap" />
            </div>
        </Frame>
    )
}

/** Pressing and dragging a card to a new slot; on tablets the cards wobble. */
export function ReorderIllustration({ touch }: { touch: boolean }) {
    const { t } = useTranslation()
    return (
        <Frame
            overlay={
                touch && (
                    <span className="absolute bottom-3 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                        <Check className="size-3.5" />
                        {t("monitor.done")}
                    </span>
                )
            }
        >
            <div className="relative flex gap-4">
                <MiniCard code="ABC" className="opacity-30" />
                <MiniCard code="DEF" className={touch ? "motion-safe:animate-jiggle" : ""} />
                {/* The picked-up card, carried over the grid. */}
                <div className="absolute top-0 left-0 motion-safe:animate-guide-drag">
                    <MiniCard code="ABC" className="shadow-lg ring-1 ring-primary/40" />
                    <Cursor touch={touch} className="top-6 left-12" />
                </div>
            </div>
        </Frame>
    )
}

/** Pinned orders sit above the yellow line with a highlighted border. */
export function PinnedIllustration() {
    return (
        <Frame className="flex-col gap-2.5">
            <div className="relative">
                <MiniCard code="ABC" className="ring-2 ring-primary" />
                <span className="absolute -top-3 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <Pin className="size-3 fill-current" />
                </span>
            </div>
            <div className="h-0.5 w-64 rounded-full bg-primary/60" />
            <div className="flex gap-3">
                <MiniCard code="DEF" />
                <MiniCard code="GHI" />
            </div>
        </Frame>
    )
}

/** The Completati page, with the button that sends an order back. */
export function CompletedIllustration() {
    const { t } = useTranslation()
    return (
        <Frame className="flex-col gap-3">
            <span className="flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[10px] font-medium shadow-sm">
                <CheckCheck className="size-3 text-green-600" />
                {t("header.completed")}
            </span>
            <MiniCard code="ABC" className="w-40">
                <MiniRow label="2× Margherita" />
                <span className="mt-1.5 flex items-center justify-center gap-1 rounded border bg-background py-1 text-[8px] font-medium">
                    <Undo2 className="size-2.5" />
                    {t("completed.restore")}
                </span>
            </MiniCard>
        </Frame>
    )
}

/** The printer badges and the Cambia button in the header. */
export function PrintersIllustration() {
    const { t } = useTranslation()
    return (
        <Frame>
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-sm">
                {[t("guide.sampleKitchen"), t("guide.sampleGrill")].map((name) => (
                    <span key={name} className="flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium">
                        <Printer className="size-3" />
                        {name}
                    </span>
                ))}
                <span className="flex items-center gap-1 text-[10px] font-medium">
                    <RefreshCw className="size-3" />
                    {t("header.change")}
                </span>
            </div>
        </Frame>
    )
}
