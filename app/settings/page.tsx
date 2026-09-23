"use client"

import { SettingsHeader } from "@/components/settings/header/SettingsHeader"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useDeviceType, type DeviceType } from "@/hooks/use-device-type"
import { Monitor, Tablet } from "lucide-react"
import { useTranslation } from "react-i18next"

const DEVICE_OPTIONS: { value: DeviceType; title: string; description: string; icon: typeof Monitor }[] = [
    {
        value: "desktop",
        title: "Desktop",
        description: "Computer con mouse o trackpad.",
        icon: Monitor,
    },
    {
        value: "tablet",
        title: "Tablet / iPad",
        description: "Dispositivo touch, comandi pensati per le dita.",
        icon: Tablet,
    },
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
                        <h2 className="text-2xl font-bold">Impostazioni</h2>
                        <p className="text-sm text-muted-foreground mt-1">Gestisci le preferenze dell&apos;applicazione.</p>
                    </div>

                    <Separator />

                    <section className="space-y-4">
                        <h3 className="text-base font-semibold">Aspetto</h3>
                        <p className="text-sm text-muted-foreground">Tema e visualizzazione.</p>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold">Dispositivo</h3>
                            <p className="text-sm text-muted-foreground">
                                Tipo di dispositivo su cui è aperta l&apos;applicazione.
                            </p>
                        </div>
                        <RadioGroup
                            value={deviceType}
                            onValueChange={(value) => setDeviceType(value as DeviceType)}
                            className="sm:grid-cols-2"
                        >
                            {DEVICE_OPTIONS.map(({ value, title, description, icon: Icon }) => (
                                <FieldLabel key={value} htmlFor={`device-${value}`} className="cursor-pointer">
                                    <Field orientation="horizontal">
                                        <FieldContent>
                                            <FieldTitle>
                                                <Icon className="h-4 w-4" />
                                                {title}
                                                {detected === value && <Badge variant="secondary">Rilevato</Badge>}
                                            </FieldTitle>
                                            <FieldDescription>{description}</FieldDescription>
                                        </FieldContent>
                                        <RadioGroupItem value={value} id={`device-${value}`} />
                                    </Field>
                                </FieldLabel>
                            ))}
                        </RadioGroup>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <h3 className="text-base font-semibold">Lingua</h3>
                        <p className="text-sm text-muted-foreground">Lingua dell&apos;interfaccia.</p>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <h3 className="text-base font-semibold">Account</h3>
                        <p className="text-sm text-muted-foreground">Informazioni utente e sessione.</p>
                    </section>
                </div>
            </main>
        </div>
    )
}
