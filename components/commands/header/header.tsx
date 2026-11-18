"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { UserMenu } from "@/components/commands/header/UserMenu"
import { useAuth } from "@/hooks/use-auth"
import { CheckCheck, CircleHelp, LayoutGrid, Maximize, Minimize, Moon, RefreshCw, Settings, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { usePrinterSelection } from "@/components/commands/monitor/PrinterSelectionContext"
import { useGuide } from "@/components/commands/guide/GuideContext"
import { useTranslation } from "react-i18next"
import { useMounted } from "@/hooks/use-mounted"
import Image from "next/image"
import { useSagraSettings } from "@/lib/settings/SettingsContext"
import { HeaderClock } from "@/components/commands/header/HeaderClock"

export function Header() {
    const { theme, setTheme } = useTheme()
    const mounted = useMounted()
    const [isFullscreen, setIsFullscreen] = useState(false)
    const router = useRouter()
    const onCompletedPage = usePathname().startsWith("/commands/completed")
    const { user } = useAuth()
    const { printers, setDialogOpen } = usePrinterSelection()
    const { openGuide } = useGuide()
    const { t } = useTranslation()
    const { sagraName } = useSagraSettings()

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener("fullscreenchange", onFsChange)
        return () => document.removeEventListener("fullscreenchange", onFsChange)
    }, [])

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    function handleLogout() {
        document.cookie = "mycomanda_user=; Max-Age=0; path=/"
        document.cookie = "mycomanda_session=; Max-Age=0; path=/"
        router.push("/login")
    }

    return (
        <header className="fixed top-0 w-full border-b bg-background z-50">
            {/* --card is translucent in light mode: the opaque header background keeps content from showing through. */}
            <div className="flex h-16 items-center justify-between px-4 md:px-6 bg-card">
                {/* Left: logo + title (with sagra name) | clock */}
                <div className="flex min-w-0 items-center gap-3">
                    <Image className="h-10 w-auto shrink-0 select-none" src="/logo.svg" alt="Logo" width={256} height={237} priority />
                    <div className="hidden shrink-0 flex-col leading-tight md:flex">
                        <h1 className="whitespace-nowrap text-2xl font-bold select-none">MyComanda</h1>
                        {sagraName && (
                            <span className="max-w-40 truncate text-xs text-muted-foreground select-none lg:max-w-64" title={sagraName}>
                                {sagraName}
                            </span>
                        )}
                    </div>
                    {/* Orologio solo su schermi larghi: sotto lg lo spazio serve alle azioni */}
                    <div className="mx-2 hidden h-8 w-px bg-border lg:block" aria-hidden />
                    <HeaderClock className="hidden lg:inline" />
                </div>

                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {printers.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden md:inline-flex cursor-pointer h-8"
                            onClick={() => setDialogOpen(true)}
                        >
                            <RefreshCw className="h-4 w-4" />
                            {t("userMenu.changePrinters")}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => router.push(onCompletedPage ? "/commands" : "/commands/completed")}
                    >
                        {onCompletedPage ? <LayoutGrid className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
                        <span className="hidden md:inline">{onCompletedPage ? t("header.monitor") : t("header.completed")}</span>
                    </Button>
                    <ButtonGroup className="hidden md:flex">
                        <Button variant="outline" className="cursor-pointer" size="icon" onClick={openGuide} title={t("header.guide")}>
                            <CircleHelp className="h-5 w-5" />
                        </Button>
                        <Button variant="outline" className="cursor-pointer" size="icon" onClick={() => router.push("/settings")} title={t("header.settings")}>
                            <Settings className="h-5 w-5" />
                        </Button>
                        {mounted && (
                            <Button
                                variant="outline"
                                className="cursor-pointer"
                                size="icon"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            >
                                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            size="icon"
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </Button>
                    </ButtonGroup>

                    {user && (
                        <UserMenu
                            user={user}
                            onLogout={handleLogout}
                            onOpenGuide={openGuide}
                            printers={printers}
                            onChangePrinters={() => setDialogOpen(true)}
                        />
                    )}
                </div>
            </div>
        </header>
    )
}
