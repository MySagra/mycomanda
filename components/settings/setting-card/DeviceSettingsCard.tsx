"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useDeviceType, type DeviceType } from "@/hooks/use-device-type"
import { Monitor, MonitorSmartphone, Tablet } from "lucide-react"
import { useTranslation } from "react-i18next"

// Title and description come from `settings.<value>` and `settings.<value>Description`.
const DEVICE_OPTIONS: { value: DeviceType; icon: typeof Monitor }[] = [
    { value: "desktop", icon: Monitor },
    { value: "tablet", icon: Tablet },
]

export function DeviceSettingsCard() {
    const { t } = useTranslation()
    const { deviceType, detected, setDeviceType } = useDeviceType()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <MonitorSmartphone className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">{t("settings.device")}</CardTitle>
                </div>
                <CardDescription className="select-none">{t("settings.deviceDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup
                    value={deviceType}
                    onValueChange={(value) => setDeviceType(value as DeviceType)}
                    className="sm:grid-cols-2"
                >
                    {DEVICE_OPTIONS.map(({ value, icon: Icon }) => (
                        <FieldLabel key={value} htmlFor={`device-${value}`} className="cursor-pointer">
                            <Field orientation="horizontal">
                                <FieldContent>
                                    <FieldTitle>
                                        <Icon className="h-4 w-4" />
                                        {t(`settings.${value}`)}
                                        {detected === value && <Badge variant="secondary">{t("settings.detected")}</Badge>}
                                    </FieldTitle>
                                    <FieldDescription>{t(`settings.${value}Description`)}</FieldDescription>
                                </FieldContent>
                                <RadioGroupItem value={value} id={`device-${value}`} />
                            </Field>
                        </FieldLabel>
                    ))}
                </RadioGroup>
            </CardContent>
        </Card>
    )
}
