"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer as PrinterIcon } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { usePrinterSelection } from "@/components/commands/monitor/PrinterSelectionContext"
import { PrinterList, toggleInSet, useSelectablePrinters } from "@/components/commands/monitor/PrinterList"

export function PrintersSettingsCard() {
    const { hydrated } = usePrinterSelection()
    const { t } = useTranslation()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <PrinterIcon className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">{t("settings.printers")}</CardTitle>
                </div>
                <CardDescription className="select-none">{t("printers.description")}</CardDescription>
            </CardHeader>
            {/* Wait for the saved selection before seeding the checkboxes from it. */}
            {hydrated && <PrintersSettingsBody />}
        </Card>
    )
}

function PrintersSettingsBody() {
    const { printers: saved, select } = usePrinterSelection()
    const { printers, loading, error, reload } = useSelectablePrinters()
    const [checked, setChecked] = useState<Set<string>>(() => new Set(saved.map((p) => p.id)))
    const { t } = useTranslation()

    const selected = printers.filter((p) => checked.has(p.id))
    const savedIds = new Set(saved.map((p) => p.id))
    const changed = selected.length !== savedIds.size || selected.some((p) => !savedIds.has(p.id))

    function save() {
        select(selected)
        toast.success(t("settings.printersSaved"))
    }

    return (
        <>
            <CardContent className="flex flex-col gap-2">
                <PrinterList
                    printers={printers}
                    loading={loading}
                    error={error}
                    onRetry={reload}
                    checked={checked}
                    onToggle={(id, value) => setChecked((prev) => toggleInSet(prev, id, value))}
                />
            </CardContent>
            {!loading && !error && printers.length > 0 && (
                <CardFooter className="justify-end">
                    <Button
                        className="select-none cursor-pointer"
                        disabled={selected.length === 0 || !changed}
                        onClick={save}
                    >
                        {t("common.save")}{selected.length > 0 && ` (${selected.length})`}
                    </Button>
                </CardFooter>
            )}
        </>
    )
}
