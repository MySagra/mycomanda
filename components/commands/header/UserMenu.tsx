"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import { ChevronDownIcon, LogOutIcon, Settings, Sun, Moon, FileText, Languages } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

interface UserMenuProps {
    user: {
        username: string
        role: string
    }
    onLogout: () => void
    onOpenAvvisi?: () => void
}

function UserAvatar({ initials, large = false }: { initials: string; large?: boolean }) {
    return (
        <div
            className={`rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold select-none shrink-0 ${large ? "h-10 w-10 text-base" : "h-8 w-8 text-sm"}`}
        >
            {initials}
        </div>
    )
}

export function UserMenu({ user, onLogout, onOpenAvvisi }: UserMenuProps) {
    const initials = user.username.slice(0, 2).toUpperCase()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const { t, i18n } = useTranslation()

    useEffect(() => { setMounted(true) }, [])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md bg-transparent px-2 hover:bg-transparent focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                <UserAvatar initials={initials} />
                <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-48 rounded-lg select-none" align="end" sideOffset={6}>
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5">
                            <UserAvatar initials={initials} />
                            <div className="grid text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.username}</span>
                                <span className="truncate text-xs text-muted-foreground">{user.role}</span>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem
                    className="md:hidden cursor-pointer"
                    onClick={() => router.push("/settings")}
                >
                    <Settings className="h-4 w-4 bg-transparent outline-none border-none text-foreground" />
                    {t("userMenu.settings")}
                </DropdownMenuItem>
                {mounted && (
                    <DropdownMenuItem
                        className="md:hidden cursor-pointer"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4 bg-transparent outline-none border-none text-foreground" /> : <Moon className="h-4 w-4 bg-transparent outline-none border-none text-foreground" />}
                        {theme === "dark" ? t("userMenu.lightTheme") : t("userMenu.darkTheme")}
                    </DropdownMenuItem>
                )}
                {onOpenAvvisi && (
                    <DropdownMenuItem
                        className="md:hidden cursor-pointer"
                        onClick={onOpenAvvisi}
                    >
                        <FileText className="h-4 w-4 bg-transparent outline-none border-none text-foreground" />
                        {t("userMenu.notices")}
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                        <Languages className="h-4 w-4 bg-transparent outline-none border-none text-foreground" />
                        {t("userMenu.language")}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuCheckboxItem
                                checked={i18n.language === 'it' || !i18n.language}
                                onClick={() => i18n.changeLanguage('it')}
                                className="cursor-pointer"
                            >
                                {t("userMenu.italian")}
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={i18n.language === 'en'}
                                onClick={() => i18n.changeLanguage('en')}
                                className="cursor-pointer"
                            >
                                {t("userMenu.english")}
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
                    <LogOutIcon className="h-4 w-4 bg-transparent outline-none border-none text-foreground" />
                    {t("userMenu.logout")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
