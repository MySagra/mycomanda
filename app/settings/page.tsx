"use client"

import { SettingsHeader } from "@/components/settings/header/SettingsHeader"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "react-i18next"

export default function SettingsPage() {
    const { t } = useTranslation()

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
