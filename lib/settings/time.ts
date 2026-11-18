// Date helpers bound to the sagra timezone (settings.general.timezone). With no
// timezone, or an invalid one, they fall back to the device's own.

interface WallClock {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
}

function wallClock(date: Date, timeZone: string): WallClock {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(date)
    const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value)
    return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") }
}

// How far the timezone's wall clock is ahead of UTC at that instant.
function offsetMs(date: Date, timeZone: string) {
    const w = wallClock(date, timeZone)
    const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second)
    return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/** The instant the timezone's wall clock reads year-month-day hour:00 (day may overflow). */
function zonedInstant(year: number, month: number, day: number, hour: number, timeZone: string) {
    const guess = Date.UTC(year, month - 1, day, hour)
    // Second pass corrects the offset when a DST change lies between guess and result.
    const first = guess - offsetMs(new Date(guess), timeZone)
    return guess - offsetMs(new Date(first), timeZone)
}

// The backend closes the service day at 07:00, so a day runs from 07:00 to
// 06:59:59.999 of the next calendar day. Before 07:00 we are still in the
// service day that started yesterday morning.
const SERVICE_DAY_START_HOUR = 7

function localServiceDayRange(now: Date) {
    const dateFrom = new Date(now)
    dateFrom.setHours(SERVICE_DAY_START_HOUR, 0, 0, 0)
    if (now < dateFrom) dateFrom.setDate(dateFrom.getDate() - 1)
    const dateTo = new Date(dateFrom)
    dateTo.setDate(dateTo.getDate() + 1)
    dateTo.setMilliseconds(-1)
    return { dateFrom, dateTo }
}

/** The service day containing `now`, with 07:00 read on the sagra's clock. */
export function serviceDayRange(now: Date, timeZone?: string) {
    if (!timeZone) return localServiceDayRange(now)
    try {
        const w = wallClock(now, timeZone)
        const day = w.hour < SERVICE_DAY_START_HOUR ? w.day - 1 : w.day
        const from = zonedInstant(w.year, w.month, day, SERVICE_DAY_START_HOUR, timeZone)
        const to = zonedInstant(w.year, w.month, day + 1, SERVICE_DAY_START_HOUR, timeZone) - 1
        return { dateFrom: new Date(from), dateTo: new Date(to) }
    } catch {
        return localServiceDayRange(now)
    }
}

/** HH:mm of an ISO date on the sagra's clock. */
export function formatTime(iso: string | null | undefined, locale: string, timeZone?: string) {
    if (!iso) return "—"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    try {
        return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone })
    } catch {
        return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    }
}
