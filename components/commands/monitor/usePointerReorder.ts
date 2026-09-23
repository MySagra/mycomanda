"use client"

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

const LONG_PRESS_MS = 450
// Touch: a finger that moves further than this before the long press fires is scrolling.
const TOUCH_TOLERANCE_PX = 10
// Mouse: moving further than this with the button held picks the card up.
const MOUSE_THRESHOLD_PX = 5
// Dragging within this distance of the top or bottom of the scroll area scrolls
// it, faster the closer the pointer gets to (or past) the edge.
const AUTO_SCROLL_EDGE_PX = 80
const AUTO_SCROLL_MAX_SPEED_PX = 18

export type ReorderMode = "touch" | "mouse"

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
    // The area that scrolls the grid, and the frame loop scrolling it.
    scroller: HTMLElement | null
    scrollFrame?: number
}

function scrollParent(el: HTMLElement): HTMLElement | null {
    for (let node = el.parentElement; node; node = node.parentElement) {
        const { overflowY } = getComputedStyle(node)
        if (overflowY === "auto" || overflowY === "scroll") return node
    }
    return document.scrollingElement as HTMLElement | null
}

interface Options {
    mode: ReorderMode
    onMove: (fromId: string, toId: string) => void
}

/**
 * Card reordering driven by pointer events instead of native HTML5 drag and
 * drop, which is unreliable on touch screens and under Wayland.
 *
 * - touch: iOS style. A long press enters reorder mode and picks the card up;
 *   in reorder mode any press picks a card up straight away.
 * - mouse: pressing and moving a few pixels picks the card up; releasing drops it.
 *
 * The picked card follows the pointer as a floating ghost and the grid reorders
 * live under it. Cards are found by `data-order-id`.
 */
export function usePointerReorder({ mode, onMove }: Options) {
    const [reordering, setReordering] = useState(false)
    const [ghost, setGhost] = useState<DragGhost | null>(null)
    const pressRef = useRef<Press | null>(null)
    const onMoveRef = useRef(onMove)
    const active = mode === "touch" && reordering

    useEffect(() => {
        onMoveRef.current = onMove
    })

    const endPress = useCallback(() => {
        const press = pressRef.current
        if (press?.timer) clearTimeout(press.timer)
        if (press?.scrollFrame) cancelAnimationFrame(press.scrollFrame)
        pressRef.current = null
        setGhost(null)
        document.body.style.removeProperty("cursor")
        if (press?.dragging && mode === "mouse") {
            // The button release after a drag still produces a click, which
            // would otherwise mark a dish as ready.
            const swallow = (e: Event) => {
                e.stopPropagation()
                e.preventDefault()
            }
            window.addEventListener("click", swallow, { capture: true, once: true })
            setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0)
        }
    }, [mode])

    const startDrag = useCallback(
        (press: Press) => {
            press.dragging = true
            setGhost({
                id: press.id,
                x: press.x,
                y: press.y,
                offsetX: press.offsetX,
                offsetY: press.offsetY,
                width: press.rect.width,
            })
            if (mode === "touch") {
                setReordering(true)
                navigator.vibrate?.(10)
            } else {
                document.body.style.cursor = "grabbing"
            }
        },
        [mode],
    )

    useEffect(() => {
        // The ghost ignores pointer events, so this finds the card below it.
        function retarget(press: Press) {
            const target = document.elementFromPoint(press.x, press.y)?.closest<HTMLElement>("[data-order-id]")
            const targetId = target?.dataset.orderId ?? null
            // Only react when the pointer enters a new card: after a swap the
            // card that was moved away can end up under the pointer again.
            if (targetId === press.lastTargetId) return
            press.lastTargetId = targetId
            if (targetId && targetId !== press.id) onMoveRef.current(press.id, targetId)
        }

        // Runs every frame while a card is held, so holding it still near an
        // edge keeps scrolling. The cards pass under the pointer as the area
        // scrolls, so the target is checked again after each step.
        function autoScroll(press: Press) {
            press.scrollFrame = requestAnimationFrame(() => autoScroll(press))
            const el = press.scroller
            if (!el) return
            const { top, bottom, height } = el.getBoundingClientRect()
            const edge = Math.min(AUTO_SCROLL_EDGE_PX, height / 4)
            const depth = press.y < top + edge ? press.y - (top + edge) : press.y > bottom - edge ? press.y - (bottom - edge) : 0
            if (depth === 0) return
            const before = el.scrollTop
            const speed = Math.max(2, Math.min(1, Math.abs(depth) / edge) * AUTO_SCROLL_MAX_SPEED_PX)
            el.scrollTop += Math.sign(depth) * speed
            if (el.scrollTop !== before) retarget(press)
        }

        function onPointerMove(e: PointerEvent) {
            const press = pressRef.current
            if (!press || e.pointerId !== press.pointerId) return
            press.x = e.clientX
            press.y = e.clientY

            if (!press.dragging) {
                const distance = Math.hypot(e.clientX - press.startX, e.clientY - press.startY)
                if (mode === "touch") {
                    if (distance > TOUCH_TOLERANCE_PX) endPress()
                    return
                }
                if (distance <= MOUSE_THRESHOLD_PX) return
                startDrag(press)
            }

            setGhost((g) => g && { ...g, x: e.clientX, y: e.clientY })
            if (press.scrollFrame === undefined) autoScroll(press)
            retarget(press)
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
    }, [mode, endPress, startDrag])

    const onCardPointerDown = useCallback(
        (id: string, e: ReactPointerEvent<HTMLElement>) => {
            if (!e.isPrimary || pressRef.current) return
            if (e.pointerType === "mouse" && e.button !== 0) return
            // The card's own buttons keep working as buttons.
            if ((e.target as HTMLElement).closest("button")) return
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
                scroller: scrollParent(e.currentTarget),
            }
            pressRef.current = press
            if (mode === "mouse") return
            if (active) startDrag(press)
            else press.timer = setTimeout(() => startDrag(press), LONG_PRESS_MS)
        },
        [mode, active, startDrag],
    )

    const exit = useCallback(() => setReordering(false), [])

    return {
        reordering: active,
        ghost,
        onCardPointerDown,
        exit,
    }
}
