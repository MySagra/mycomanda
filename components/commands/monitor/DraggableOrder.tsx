"use client"

import { useState, type DragEvent } from "react"
import { GripVertical } from "lucide-react"
import { OrderCard } from "./OrderCard"
import type { SSEOrder } from "./types"

const MIME = "application/x-order-id"

interface Props {
    order: SSEOrder
    printerId: string
    onMove: (fromId: string, toId: string) => void
}

export function DraggableOrder({ order, printerId, onMove }: Props) {
    const [dragging, setDragging] = useState(false)
    const [over, setOver] = useState(false)

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
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={[
                "relative group w-fit max-w-sm select-none cursor-grab active:cursor-grabbing transition-all",
                dragging ? "opacity-40" : "",
                over ? "ring-2 ring-primary rounded-xl" : "",
            ].join(" ")}
        >
            <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-1 ring-border opacity-0 group-hover:opacity-100 pointer-events-none">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="pointer-events-none">
                <OrderCard order={order} printerId={printerId} />
            </div>
        </div>
    )
}
