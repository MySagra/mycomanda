"use client"

import { Button } from "@/components/radix-ui/button"
import { ButtonGroup } from "@/components/radix-ui/button-group"
import { UserMenu } from "@/components/commands/header/UserMenu"
import { useAuth } from "@/hooks/use-auth"
import { CheckCheck, CircleHelp, LayoutGrid, Maximize, Minimize, Moon, Printer, Settings, Sun } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/** Stile comune dei "chip" informativi dell'header: stessa altezza e raggio dei pulsanti (come MyCassa). */
const headerChipClass =
    "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium select-none whitespace-nowrap"

// Layout and styles follow MyCassa's header (CassaHeader). Below md the icon
// group moves into the user menu, as the monitor also runs on phones.
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
    const printerNames = printers.map((p) => p.name).join(", ")
    const themeLabel = theme === "dark" ? t("userMenu.lightTheme") : t("userMenu.darkTheme")
    const fullscreenLabel = isFullscreen ? t("header.exitFullscreen") : t("header.fullscreen")

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
                {/* Left: Logo + Title */}
                <div className="flex items-center gap-3 min-w-0 shrink-0">
                    <Image
                        src="/logo.svg"
                        alt="Logo"
                        width={256}
                        height={237}
                        priority
                        className="mx-auto h-10 w-auto select-none"
                    />
                    <div className="hidden md:flex flex-col min-w-0 leading-tight">
                        <h1 className="text-2xl font-bold select-none">MyComanda</h1>
                        {sagraName && (
                            <span className="text-xs text-muted-foreground truncate max-w-64 select-none" title={sagraName}>
                                {sagraName}
                            </span>
                        )}
                    </div>
                    {/* Orologio solo su schermi larghi: sui tablet lo spazio serve alle azioni */}
                    <div className="mx-2 hidden h-8 w-px bg-border lg:block" aria-hidden />
                    <HeaderClock className="hidden lg:inline" />
                </div>

                {/* Right: status chips | actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {printers.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <button
                                        type="button"
                                        className={cn(headerChipClass, "hidden md:inline-flex cursor-pointer text-muted-foreground bg-muted/50 hover:bg-muted")}
                                        onClick={() => setDialogOpen(true)}
                                    />
                                }
                            >
                                <Printer className="h-4 w-4" />
                                <span className="max-w-48 truncate">{printerNames}</span>
                            </TooltipTrigger>
                            <TooltipContent>{t("userMenu.changePrinters")}</TooltipContent>
                        </Tooltip>
                    )}

                    <div className="mx-1 hidden h-6 w-px bg-border md:block" aria-hidden />

                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => router.push(onCompletedPage ? "/commands" : "/commands/completed")}
                    >
                        {onCompletedPage ? <LayoutGrid className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
                        <span className="hidden md:inline">{onCompletedPage ? t("header.monitor") : t("header.completed")}</span>
                    </Button>
                    <ButtonGroup className="hidden md:flex">
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button variant="outline" className="cursor-pointer" size="icon" onClick={() => router.push("/settings")} aria-label={t("userMenu.settings")} />
                                }
                            >
                                <Settings className="h-5 w-5" />
                            </TooltipTrigger>
                            <TooltipContent>{t("userMenu.settings")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        variant="outline"
                                        className="cursor-pointer"
                                        size="icon"
                                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                        aria-label={themeLabel}
                                    />
                                }
                            >
                                {mounted && (theme === "dark" ? <Sun className="h-5 w-5 cursor-pointer" /> : <Moon className="h-5 w-5 cursor-pointer" />)}
                            </TooltipTrigger>
                            <TooltipContent>{themeLabel}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button variant="outline" className="cursor-pointer" size="icon" onClick={toggleFullscreen} aria-label={fullscreenLabel} />
                                }
                            >
                                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                            </TooltipTrigger>
                            <TooltipContent>{fullscreenLabel}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button variant="outline" className="cursor-pointer" size="icon" onClick={openGuide} aria-label={t("header.guide")} />
                                }
                            >
                                <CircleHelp className="h-5 w-5" />
                            </TooltipTrigger>
                            <TooltipContent>{t("header.guide")}</TooltipContent>
                        </Tooltip>
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
