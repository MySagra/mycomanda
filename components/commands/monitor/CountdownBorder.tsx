import type { CSSProperties } from "react"
import { cn } from "cn"

interface Props {
    // Corner radius of the element it wraps, in px.
    radius: number
    // The animation that drains the stroke, e.g. `animate-border-drain`.
    className?: string
    style?: CSSProperties
}

/**
 * A stroke drawn on the edge of its positioned parent that empties like a
 * progress bar. The stroke straddles the edge, like a Tailwind ring.
 */
export function CountdownBorder({ radius, className, style }: Props) {
    return (
        <svg aria-hidden className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible">
            <rect
                width="100%"
                height="100%"
                rx={radius}
                pathLength={100}
                strokeDasharray="100 100"
                className={cn("fill-none stroke-green-600 stroke-4 dark:stroke-green-500", className)}
                style={style}
            />
        </svg>
    )
}
