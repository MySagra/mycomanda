"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer as PrinterIcon } from "lucide-react"
import type { Printer } from "./types"
import { PrinterList, toggleInSet, useSelectablePrinters } from "./PrinterList"
import { useTranslation } from "react-i18next"

interface Props {
    open: boolean
    // Without a current selection the dialog cannot be dismissed: the monitor
    // has nothing to show until at least one printer is chosen.
    required: boolean
    selectedIds: string[]
    onOpenChange: (open: boolean) => void
    onConfirm: (printers: Printer[]) => void
}

export function PrinterSelector({ open, required, selectedIds, onOpenChange, onConfirm }: Props) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next && required) return
                onOpenChange(next)
            }}
        >
            <DialogContent showCloseButton={!required} className="sm:max-w-lg">
                {/* The popup unmounts on close, so every open reloads the list
                    and starts the draft from the saved selection. */}
                <PrinterSelectorBody
                    required={required}
                    selectedIds={selectedIds}
                    onCancel={() => onOpenChange(false)}
                    onConfirm={(printers) => {
                        onConfirm(printers)
                        onOpenChange(false)
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}

interface BodyProps {
    required: boolean
    selectedIds: string[]
    onCancel: () => void
    onConfirm: (printers: Printer[]) => void
}

function PrinterSelectorBody({ required, selectedIds, onCancel, onConfirm }: BodyProps) {
    const { printers, loading, error, reload } = useSelectablePrinters()
    const [checked, setChecked] = useState<Set<string>>(() => new Set(selectedIds))
    const { t } = useTranslation()

    function confirm() {
        onConfirm(printers.filter((p) => checked.has(p.id)))
    }

    const selectedCount = printers.filter((p) => checked.has(p.id)).length

    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <PrinterIcon className="h-5 w-5" />
                    {t("printers.title")}
                </DialogTitle>
                <DialogDescription>
                    {t("printers.description")}
                </DialogDescription>
            </DialogHeader>

            <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                <PrinterList
                    printers={printers}
                    loading={loading}
                    error={error}
                    onRetry={reload}
                    checked={checked}
                    onToggle={(id, value) => setChecked((prev) => toggleInSet(prev, id, value))}
                />
            </div>

            <DialogFooter>
                {!required && (
                    <Button variant="outline" className="cursor-pointer" onClick={onCancel}>
                        {t("common.cancel")}
                    </Button>
                )}
                <Button className="cursor-pointer" disabled={selectedCount === 0} onClick={confirm}>
                    {t("common.confirm")}{selectedCount > 0 && ` (${selectedCount})`}
                </Button>
            </DialogFooter>
        </>
    )
}
