"use client"

import { SettingsHeader } from "@/components/settings/header/SettingsHeader"
import { AppearanceSettingsCard } from "@/components/settings/setting-card/AppearanceSettingsCard"
import { DeviceSettingsCard } from "@/components/settings/setting-card/DeviceSettingsCard"
import { MonitorSettingsCard } from "@/components/settings/setting-card/MonitorSettingsCard"
import { GuideSettingsCard } from "@/components/settings/setting-card/GuideSettingsCard"
import { PrintersSettingsCard } from "@/components/settings/setting-card/PrintersSettingsCard"
import { PrinterSelectionProvider } from "@/components/commands/monitor/PrinterSelectionContext"
import { GuideProvider } from "@/components/commands/guide/GuideContext"

export default function SettingsPage() {
    return (
        <PrinterSelectionProvider>
            <GuideProvider>
                <div className="h-screen flex flex-col overflow-hidden bg-background">
                    <SettingsHeader />
                    <main className="flex-1 overflow-y-auto pt-16">
                        <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                            <PrintersSettingsCard />
                            <DeviceSettingsCard />
                            <MonitorSettingsCard />
                            <AppearanceSettingsCard />
                            <GuideSettingsCard />
                        </div>
                    </main>
                </div>
            </GuideProvider>
        </PrinterSelectionProvider>
    )
}
