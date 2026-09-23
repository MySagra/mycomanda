"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Badge } from "@/components/ui/badge"
import { UserMenu } from "@/components/commands/header/UserMenu"
import { useAuth } from "@/hooks/use-auth"
import { CheckCheck, LayoutGrid, Maximize, Minimize, Moon, Printer as PrinterIcon, RefreshCw, Settings, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { usePrinterSelection } from "@/components/commands/monitor/PrinterSelectionContext"

export function Header() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const router = useRouter()
    const onCompletedPage = usePathname().startsWith("/commands/completed")
    const { user } = useAuth()
    const { printers, setDialogOpen } = usePrinterSelection()

    useEffect(() => {
        setMounted(true)
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
        <header className="fixed top-0 w-full border-b bg-card z-50">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3 min-w-0 shrink-0">
                    <img className="mx-auto h-10 w-auto select-none" src="/logo.svg" />
                    <h1 className="text-2xl font-bold select-none">MyComanda</h1>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {printers.length > 0 && (
                        <div className="flex items-center gap-2 pr-3 border-r min-w-0">
                            <div className="flex flex-wrap items-center gap-1 max-w-md">
                                {printers.map((p) => (
                                    <Badge key={p.id} variant="secondary" className="gap-1">
                                        <PrinterIcon className="h-3.5 w-3.5" />
                                        {p.name}
                                    </Badge>
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer h-8"
                                onClick={() => setDialogOpen(true)}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Cambia
                            </Button>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => router.push(onCompletedPage ? "/commands" : "/commands/completed")}
                    >
                        {onCompletedPage ? <LayoutGrid className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
                        {onCompletedPage ? "Monitor" : "Completati"}
                    </Button>
                    <ButtonGroup>
                        <Button variant="outline" className="cursor-pointer" size="icon" onClick={() => router.push("/settings")}>
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

                    {user && <UserMenu user={user} onLogout={handleLogout} />}
                </div>
            </div>
        </header>
    )
}
