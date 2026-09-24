"use client"

import { SettingsHeader } from "@/components/settings/header/SettingsHeader"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useDeviceType, type DeviceType } from "@/hooks/use-device-type"
import { Monitor, Tablet } from "lucide-react"
import { useTranslation } from "react-i18next"

// Title and description come from `settings.<value>` and `settings.<value>Description`.
const DEVICE_OPTIONS: { value: DeviceType; icon: typeof Monitor }[] = [
    { value: "desktop", icon: Monitor },
    { value: "tablet", icon: Tablet },
]

export default function SettingsPage() {
    const { t } = useTranslation()
    const { deviceType, detected, setDeviceType } = useDeviceType()

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <SettingsHeader />
            <main className="flex-1 overflow-y-auto pt-16">
                <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold">{t("settings.title")}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{t("settings.subtitle")}</p>
                    </div>

                    <Separator />

                    <section className="space-y-4">
                        <h3 className="text-base font-semibold">{t("settings.appearance")}</h3>
                        <p className="text-sm text-muted-foreground">{t("settings.appearanceDescription")}</p>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold">{t("settings.device")}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.deviceDescription")}
                            </p>
                        </div>
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
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <h3 className="text-base font-semibold">{t("settings.language")}</h3>
                        <p className="text-sm text-muted-foreground">{t("settings.languageDescription")}</p>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <h3 className="text-base font-semibold">{t("settings.account")}</h3>
                        <p className="text-sm text-muted-foreground">{t("settings.accountDescription")}</p>
                    </section>
                </div>
            </main>
        </div>
    )
}
