"use client"

import { useState, type ReactNode } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDeviceType } from "@/hooks/use-device-type"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import {
    AutoCompleteIllustration,
    CompletedIllustration,
    DishProgressIllustration,
    HoverActionsIllustration,
    PinnedIllustration,
    PrintersIllustration,
    ReorderIllustration,
    TapActionsIllustration,
} from "./GuideIllustrations"

interface Step {
    title: string
    text: string
    image: ReactNode
}

// Desktop and tablet share the steps; only the gestures differ.
function buildSteps(touch: boolean, t: TFunction): Step[] {
    const gesture = touch ? "Touch" : "Mouse"
    return [
        {
            title: t("guide.dishesTitle"),
            text: t(`guide.dishes${gesture}`),
            image: <DishProgressIllustration touch={touch} />,
        },
        {
            title: t("guide.autoTitle"),
            text: t(`guide.auto${gesture}`),
            image: <AutoCompleteIllustration />,
        },
        {
            title: t("guide.actionsTitle"),
            text: t(`guide.actions${gesture}`),
            image: touch ? <TapActionsIllustration /> : <HoverActionsIllustration />,
        },
        {
            title: t("guide.reorderTitle"),
            text: t(`guide.reorder${gesture}`),
            image: <ReorderIllustration touch={touch} />,
        },
        {
            title: t("guide.pinnedTitle"),
            text: t("guide.pinnedText"),
            image: <PinnedIllustration />,
        },
        {
            title: t("guide.completedTitle"),
            text: t("guide.completedText"),
            image: <CompletedIllustration />,
        },
        {
            title: t("guide.printersTitle"),
            text: t("guide.printersText"),
            image: <PrintersIllustration />,
        },
    ]
}

interface Props {
    open: boolean
    onClose: () => void
}

export function UsageGuide({ open, onClose }: Props) {
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="sm:max-w-md">
                {/* The popup unmounts on close, so every open starts from the first step. */}
                <GuideBody onClose={onClose} />
            </DialogContent>
        </Dialog>
    )
}

function GuideBody({ onClose }: { onClose: () => void }) {
    const { deviceType } = useDeviceType()
    const touch = deviceType === "tablet"
    const { t } = useTranslation()
    const steps = buildSteps(touch, t)
    const [index, setIndex] = useState(0)
    const step = steps[index]
    const last = index === steps.length - 1

    return (
        <>
            <DialogHeader>
                <span className="text-xs font-medium text-muted-foreground">
                    {t("guide.progress", { current: index + 1, total: steps.length })}
                </span>
                <DialogTitle className={cn("text-lg", touch && "text-xl")}>{step.title}</DialogTitle>
            </DialogHeader>

            {/* Keyed so each step's animation starts from the beginning. */}
            <div key={index} className="animate-in fade-in-0 duration-200">
                {step.image}
            </div>

            <DialogDescription className={cn("min-h-16 text-foreground/90", touch && "text-base")}>
                {step.text}
            </DialogDescription>

            <div className="flex justify-center gap-1.5">
                {steps.map((s, i) => (
                    <button
                        key={s.title}
                        type="button"
                        aria-label={t("guide.goToStep", { step: i + 1 })}
                        onClick={() => setIndex(i)}
                        className={cn(
                            "h-2 cursor-pointer rounded-full transition-all",
                            i === index ? "w-5 bg-primary" : "w-2 bg-muted-foreground/30",
                        )}
                    />
                ))}
            </div>

            <DialogFooter>
                <div className="flex gap-2">
                    {index > 0 && (
                        <Button variant="outline" className="cursor-pointer" onClick={() => setIndex(index - 1)}>
                            <ChevronLeft />
                            {t("guide.back")}
                        </Button>
                    )}
                    {last ? (
                        <Button className="cursor-pointer" onClick={onClose}>
                            {t("guide.start")}
                        </Button>
                    ) : (
                        <Button className="cursor-pointer" onClick={() => setIndex(index + 1)}>
                            {t("guide.next")}
                            <ChevronRight />
                        </Button>
                    )}
                </div>
            </DialogFooter>
        </>
    )
}
