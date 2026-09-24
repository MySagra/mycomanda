import type { SSEOrder } from "./types"

// SHOW_NUMBERS=true puts the ticket number first and the code second;
// otherwise the code comes first. Orders without a ticket number show only the code.
export function orderLabels(
    order: Pick<SSEOrder, "displayCode" | "ticketNumber">,
    showNumbers: boolean,
): { primary: string; secondary: string | null } {
    if (order.ticketNumber == null) return { primary: order.displayCode, secondary: null }
    const ticket = String(order.ticketNumber)
    return showNumbers
        ? { primary: ticket, secondary: order.displayCode }
        : { primary: order.displayCode, secondary: `#${ticket}` }
}
