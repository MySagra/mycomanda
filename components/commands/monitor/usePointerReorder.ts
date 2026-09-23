"use client"

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

const LONG_PRESS_MS = 450
// A finger that moves further than this before the long press fires is scrolling.
const MOVE_TOLERANCE_PX = 10

export interface DragGhost {
    id: string
    x: number
    y: number
    offsetX: number
    offsetY: number
    width: number
}

interface Press {
    id: string
    pointerId: number
    x: number
    y: number
    rect: DOMRect
    offsetX: number
    offsetY: number
    startX: number
    startY: number
    dragging: boolean
    lastTargetId: string | null
    timer?: ReturnType<typeof setTimeout>
}

interface Options {
    enabled: boolean
    onMove: (fromId: string, toId: string) => void
}

/**
 * iOS-style reordering for touch screens. A long press on a card enters
 * reorder mode and picks the card up; in reorder mode any press picks a card
 * up straight away. The picked card follows the finger as a floating ghost and
 * the grid reorders live under it. Cards are found by `data-order-id`.
 */
export function useTouchReorder({ enabled, onMove }: Options) {
    const [reordering, setReordering] = useState(false)
    const [ghost, setGhost] = useState<DragGhost | null>(null)
    const pressRef = useRef<Press | null>(null)
    const onMoveRef = useRef(onMove)
    const active = enabled && reordering

    useEffect(() => {
        onMoveRef.current = onMove
    })

    const endPress = useCallback(() => {
        const press = pressRef.current
        if (press?.timer) clearTimeout(press.timer)
        pressRef.current = null
        setGhost(null)
    }, [])

    const startDrag = useCallback((press: Press) => {
        press.dragging = true
        setReordering(true)
        setGhost({
            id: press.id,
            x: press.x,
            y: press.y,
            offsetX: press.offsetX,
            offsetY: press.offsetY,
            width: press.rect.width,
        })
        navigator.vibrate?.(10)
    }, [])

    useEffect(() => {
        if (!enabled) return

        function onPointerMove(e: PointerEvent) {
            const press = pressRef.current
            if (!press || e.pointerId !== press.pointerId) return
            press.x = e.clientX
            press.y = e.clientY

            if (!press.dragging) {
                if (Math.hypot(e.clientX - press.startX, e.clientY - press.startY) > MOVE_TOLERANCE_PX) endPress()
                return
            }

            setGhost((g) => g && { ...g, x: e.clientX, y: e.clientY })

            // The ghost ignores pointer events, so this finds the card below it.
            const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-order-id]")
            const targetId = target?.dataset.orderId ?? null
            // Only react when the finger enters a new card: after a swap the
            // card that was moved away can end up under the finger again.
            if (targetId === press.lastTargetId) return
            press.lastTargetId = targetId
            if (targetId && targetId !== press.id) onMoveRef.current(press.id, targetId)
        }

        function onPointerEnd(e: PointerEvent) {
            if (pressRef.current?.pointerId !== e.pointerId) return
            endPress()
        }

        // Once a card is picked up the finger moves the card, not the page.
        function onTouchMove(e: TouchEvent) {
            if (pressRef.current?.dragging && e.cancelable) e.preventDefault()
        }

        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerEnd)
        window.addEventListener("pointercancel", onPointerEnd)
        window.addEventListener("touchmove", onTouchMove, { passive: false })
        return () => {
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerEnd)
            window.removeEventListener("pointercancel", onPointerEnd)
            window.removeEventListener("touchmove", onTouchMove)
            endPress()
        }
    }, [enabled, endPress])

    const onCardPointerDown = useCallback(
        (id: string, e: ReactPointerEvent<HTMLElement>) => {
            if (!enabled || !e.isPrimary || pressRef.current) return
            if (e.pointerType === "mouse" && e.button !== 0) return
            const rect = e.currentTarget.getBoundingClientRect()
            const press: Press = {
                id,
                pointerId: e.pointerId,
                x: e.clientX,
                y: e.clientY,
                startX: e.clientX,
                startY: e.clientY,
                rect,
                offsetX: e.clientX - rect.left,
                offsetY: e.clientY - rect.top,
                dragging: false,
                lastTargetId: id,
            }
            pressRef.current = press
            if (active) startDrag(press)
            else press.timer = setTimeout(() => startDrag(press), LONG_PRESS_MS)
        },
        [enabled, active, startDrag],
    )

    const exit = useCallback(() => setReordering(false), [])

    return {
        reordering: active,
        ghost: enabled ? ghost : null,
        onCardPointerDown,
        exit,
    }
}
