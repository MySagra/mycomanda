// Shape of GET /v1/settings and of the `settings-update` SSE event.
// Only the fields MyComanda reads are typed strictly; the rest is kept loose.
export interface SagraSettings {
    sagra: {
        name: string
        receiptLogo: string | null
    }
    settings: {
        general: { timezone: string; currency: string }
        tickets: { showNumbers: boolean }
        preparation: { syncCompletion: boolean }
        [section: string]: unknown
    }
    updatedAt: string
}
