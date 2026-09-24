"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CircleHelp, Play } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useGuide } from "@/components/commands/guide/GuideContext"

export function GuideSettingsCard() {
    const { openGuide } = useGuide()
    const { t } = useTranslation()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CircleHelp className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">{t("settings.guide")}</CardTitle>
                </div>
                <CardDescription className="select-none">{t("settings.guideDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Label>{t("settings.tutorial")}</Label>
                    <Button variant="outline" size="sm" className="select-none cursor-pointer" onClick={openGuide}>
                        <Play className="h-4 w-4" />
                        {t("settings.openGuide")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
