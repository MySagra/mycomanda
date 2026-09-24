"use client"

import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/commands/header/UserMenu"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export function SettingsHeader() {
    const router = useRouter()
    const { user } = useAuth()
    const { t } = useTranslation()

    function handleLogout() {
        document.cookie = "mycomanda_user=; Max-Age=0; path=/"
        document.cookie = "mycomanda_session=; Max-Age=0; path=/"
        router.push("/login")
    }

    return (
        <header className="fixed top-0 w-full border-b bg-background z-50">
            {/* --card is translucent in light mode: the opaque header background keeps content from showing through. */}
            <div className="flex h-16 items-center justify-between px-4 md:px-6 bg-card">
                <div className="flex items-center gap-2">
                    <img
                        src="/logo.svg"
                        alt="Logo"
                        className="mx-auto h-10 w-auto select-none cursor-pointer"
                        onClick={() => router.push("/commands")}
                    />
                    <h1 className="hidden md:block text-2xl font-bold select-none">{t("settingsHeader.title")}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="lg"
                        className="select-none cursor-pointer"
                        onClick={() => router.push("/commands")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("header.backToOrders")}
                    </Button>
                    {user && <UserMenu user={user} onLogout={handleLogout} showSettings={false} />}
                </div>
            </div>
        </header>
    )
}
