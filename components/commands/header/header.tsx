"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { UserMenu } from "@/components/commands/header/UserMenu"
import { useAuth } from "@/hooks/use-auth"
import { Maximize, Minimize, Moon, Settings, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function Header() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const router = useRouter()
    const { user } = useAuth()

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

                <div className="flex items-center gap-2 shrink-0">
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
