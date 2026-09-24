"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Moon, Palette, Sun, ZoomIn, ZoomOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"
import { CARD_SIZE_DEFAULT, CARD_SIZE_MAX, CARD_SIZE_MIN, CARD_SIZE_STEP, useCardSize } from "@/hooks/use-card-size"
import { Slider } from "@/components/ui/slider"

export function AppearanceSettingsCard() {
    const { theme, setTheme } = useTheme()
    // false on the server, true after hydration: the theme is only known on the client.
    const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
    const { t } = useTranslation()
    const { cardSize, setCardSize } = useCardSize()

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
                <div className="space-y-3">
                    <div className="space-y-0.5">
                        <Label>{t("settings.cardSize")}</Label>
                        <div className="text-sm text-muted-foreground select-none">{t("settings.cardSizeDescription")}</div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-4">
                        <ZoomOut className="h-5 w-5 shrink-0 text-primary" />
                        <Slider
                            // Thicker track and bigger thumb than the default slider, readable on the tinted box.
                            className="flex-1 **:data-[slot=slider-track]:h-2.5! **:data-[slot=slider-track]:bg-foreground/15 **:data-[slot=slider-thumb]:size-5 **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-primary **:data-[slot=slider-thumb]:shadow-md cursor-pointer"
                            min={CARD_SIZE_MIN}
                            max={CARD_SIZE_MAX}
                            step={CARD_SIZE_STEP}
                            value={[cardSize]}
                            onValueChange={(value) => setCardSize(Array.isArray(value) ? value[0] : value)}
                            aria-label={t("settings.cardSize")}
                        />
                        <ZoomIn className="h-5 w-5 shrink-0 text-primary" />
                        <span className="min-w-14 text-center text-lg font-bold tabular-nums select-none">
                            {mounted ? cardSize : CARD_SIZE_DEFAULT}%
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[CARD_SIZE_DEFAULT, (CARD_SIZE_DEFAULT + CARD_SIZE_MAX) / 2, CARD_SIZE_MAX].map((preset) => (
                            <Button
                                key={preset}
                                variant={mounted && cardSize === preset ? "default" : "outline"}
                                size="sm"
                                className="select-none cursor-pointer"
                                onClick={() => setCardSize(preset)}
                            >
                                {preset}%
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
