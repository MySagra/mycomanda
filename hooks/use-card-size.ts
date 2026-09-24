"use client"

import { useCallback, useSyncExternalStore, type CSSProperties } from "react"

// Card size as a percentage of the default minimum card width.
export const CARD_SIZE_MIN = 100
export const CARD_SIZE_MAX = 200
export const CARD_SIZE_STEP = 10
export const CARD_SIZE_DEFAULT = 100
const BASE_MIN_WIDTH_REM = 18

const STORAGE_KEY = "mycomanda_card_size"
// `storage` only fires in other tabs, so same-tab updates use their own event.
const CHANGE_EVENT = "mycomanda:card-size"

function readStored(): number {
    try {
        const value = Number(localStorage.getItem(STORAGE_KEY))
        return Number.isFinite(value) && value >= CARD_SIZE_MIN && value <= CARD_SIZE_MAX ? value : CARD_SIZE_DEFAULT
    } catch {
        return CARD_SIZE_DEFAULT
    }
}

function subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange)
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => {
        window.removeEventListener("storage", onChange)
        window.removeEventListener(CHANGE_EVENT, onChange)
    }
}

/** Order card size chosen in the settings, saved on this device. */
export function useCardSize() {
    const cardSize = useSyncExternalStore(subscribe, readStored, () => CARD_SIZE_DEFAULT)

    const setCardSize = useCallback((value: number) => {
        try {
            localStorage.setItem(STORAGE_KEY, String(value))
        } catch {
            // ignore
        }
        window.dispatchEvent(new Event(CHANGE_EVENT))
    }, [])

    // Grids and cards read `--card-min-width` for their column and minimum width.
    const cardSizeStyle = {
        "--card-min-width": `${(BASE_MIN_WIDTH_REM * cardSize) / 100}rem`,
    } as CSSProperties

    return { cardSize, setCardSize, cardSizeStyle }
}
