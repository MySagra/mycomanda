"use client"

import { useCallback, useSyncExternalStore } from "react"

export type DeviceType = "desktop" | "tablet"

const STORAGE_KEY = "mycomanda_device_type"
// `storage` only fires in other tabs, so same-tab updates use their own event.
const CHANGE_EVENT = "mycomanda:device-type"
const COARSE_POINTER_QUERY = "(pointer: coarse)"

// A coarse primary pointer means a finger: tablets and iPads. Touchscreen
// laptops still report a fine primary pointer (mouse/trackpad) and stay desktop.
function detectDeviceType(): DeviceType {
    return window.matchMedia(COARSE_POINTER_QUERY).matches ? "tablet" : "desktop"
}

function readStored(): DeviceType | null {
    try {
        const value = localStorage.getItem(STORAGE_KEY)
        return value === "desktop" || value === "tablet" ? value : null
    } catch {
        return null
    }
}

function subscribe(onChange: () => void) {
    const mql = window.matchMedia(COARSE_POINTER_QUERY)
    mql.addEventListener("change", onChange)
    window.addEventListener("storage", onChange)
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => {
        mql.removeEventListener("change", onChange)
        window.removeEventListener("storage", onChange)
        window.removeEventListener(CHANGE_EVENT, onChange)
    }
}

/**
 * Device type chosen in the settings. Until the user picks one, it follows the
 * detected input method of the device the page is opened on.
 */
export function useDeviceType() {
    const stored = useSyncExternalStore(subscribe, readStored, () => null)
    const detected = useSyncExternalStore(subscribe, detectDeviceType, () => "desktop" as const)

    const setDeviceType = useCallback((value: DeviceType) => {
        try {
            localStorage.setItem(STORAGE_KEY, value)
        } catch {
            // ignore
        }
        window.dispatchEvent(new Event(CHANGE_EVENT))
    }, [])

    return {
        deviceType: stored ?? detected,
        detected,
        setDeviceType,
    }
}
