"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useDeviceType } from "@/hooks/use-device-type"
import { CheckCheck, Hash, Undo2, User, Utensils } from "lucide-react"
import { cn } from "cn"
import type { SSEOrder } from "@/components/commands/monitor/types"
import { orderLabels } from "@/components/commands/monitor/orderLabel"
import { useEnv } from "@/lib/contexts/EnvContext"
import { useTranslation } from "react-i18next"

interface Props {
    order: SSEOrder
    printerIds: string[]
    onRestore: (id: string) => Promise<void>
}

function formatTime(iso: string | null | undefined, locale: string) {
    if (!iso) return "—"
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
}

export function CompletedOrderCard({ order, printerIds, onRestore }: Props) {
    const [restoring, setRestoring] = useState(false)
    const { deviceType } = useDeviceType()
    const { t, i18n } = useTranslation()
    const { showNumbers } = useEnv()
    const labels = orderLabels(order, showNumbers)
    const items = order.orderItems.filter((it) => it.food?.printerId != null && printerIds.includes(it.food.printerId))

    async function restore() {
        setRestoring(true)
        try {
            await onRestore(order.id)
        } finally {
            setRestoring(false)
        }
    }

    return (
        <Card className="min-w-72 w-full">
            <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-base px-2.5 py-0.5">
                            <Hash className="h-3.5 w-3.5" />
                            {labels.primary}
                        </Badge>
                        {labels.secondary && <Badge variant="outline">{labels.secondary}</Badge>}
                    </div>
                    <div
                        className="flex items-center gap-1 text-sm text-green-600 dark:text-green-500"
                        title={t("completed.completedAt")}
                    >
                        <CheckCheck className="h-4 w-4" />
                        {formatTime(order.completedAt, i18n.language)}
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

            <Separator className="h-px w-full" />

            <CardContent className="flex flex-col gap-1.5">
                {items.map((it) => (
                    <div key={it.id} className="flex flex-col gap-0.5 px-1">
                        <div className="flex items-baseline gap-2 text-muted-foreground">
                            <span className="font-bold tabular-nums text-foreground">{it.quantity}×</span>
                            <span className="flex-1">{it.food?.name ?? "—"}</span>
                        </div>
                        {it.notes && <div className="pl-7 text-sm italic text-muted-foreground">{it.notes}</div>}
                    </div>
                ))}
            </CardContent>

            <CardFooter>
                <Button
                    variant="outline"
                    className={cn("w-full cursor-pointer gap-2", deviceType === "tablet" && "h-12 text-base")}
                    onClick={restore}
                    disabled={restoring}
                >
                    {restoring ? <Spinner /> : <Undo2 className="size-4" />}
                    {t("completed.restore")}
                </Button>
            </CardFooter>
        </Card>
    )
}
