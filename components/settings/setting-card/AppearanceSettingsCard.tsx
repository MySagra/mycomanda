"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Moon, Palette, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"

export function AppearanceSettingsCard() {
    const { theme, setTheme } = useTheme()
    // false on the server, true after hydration: the theme is only known on the client.
    const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
    const { t } = useTranslation()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <CardTitle className="select-none">{t("settings.appearance")}</CardTitle>
                </div>
                <CardDescription className="select-none">{t("settings.appearanceDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-0.5">
                        <Label>{t("settings.theme")}</Label>
                        <div className="text-sm text-muted-foreground select-none">{t("settings.themeDescription")}</div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={mounted && theme === "light" ? "default" : "outline"}
                            size="sm"
                            className="select-none cursor-pointer"
                            onClick={() => setTheme("light")}
                        >
                            <Sun className="h-4 w-4" />
                            {t("settings.light")}
                        </Button>
                        <Button
                            variant={mounted && theme === "dark" ? "default" : "outline"}
                            size="sm"
                            className="select-none cursor-pointer"
                            onClick={() => setTheme("dark")}
                        >
                            <Moon className="h-4 w-4" />
                            {t("settings.dark")}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
