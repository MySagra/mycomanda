"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"

const LANGUAGES = [
    { code: "it", labelKey: "userMenu.italian" },
    { code: "en", labelKey: "userMenu.english" },
] as const

export function LanguageSettingsCard() {
    const { t, i18n } = useTranslation()
    const current = i18n.language || "it"

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">{t("settings.language")}</CardTitle>
                </div>
                <CardDescription className="select-none">{t("settings.languageDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Label>{t("settings.interfaceLanguage")}</Label>
                    <div className="flex gap-2">
                        {LANGUAGES.map(({ code, labelKey }) => (
                            <Button
                                key={code}
                                variant={current.startsWith(code) ? "default" : "outline"}
                                size="sm"
                                className="select-none cursor-pointer"
                                onClick={() => i18n.changeLanguage(code)}
                            >
                                {t(labelKey)}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
