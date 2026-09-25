"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { useAutoCompletion } from "@/hooks/use-auto-completion"
import { clearLocallyCompletedOrders } from "@/components/commands/monitor/useMonitorState"
import { CheckCheck, Utensils } from "lucide-react"
import { useTranslation } from "react-i18next"

export function MonitorSettingsCard() {
    const { t } = useTranslation()
    const { autoCompletion, setAutoCompletion } = useAutoCompletion()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">{t("settings.monitor")}</CardTitle>
                </div>
                <CardDescription className="select-none">{t("settings.monitorDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
                <FieldLabel htmlFor="auto-completion" className="cursor-pointer">
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldTitle>
                                <CheckCheck className="h-4 w-4" />
                                {t("settings.autoCompletion")}
                            </FieldTitle>
                            <FieldDescription>{t("settings.autoCompletionDescription")}</FieldDescription>
                        </FieldContent>
                        <Switch
                            id="auto-completion"
                            checked={autoCompletion}
                            onCheckedChange={(checked) => {
                                setAutoCompletion(checked)
                                // Each change starts over: no order from before comes back to the completed row.
                                clearLocallyCompletedOrders()
                            }}
                        />
                    </Field>
                </FieldLabel>
            </CardContent>
        </Card>
    )
}
