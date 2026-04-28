"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  CalendarHeart,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Pill,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Logo } from "@/components/shared/logo"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { useI18n } from "@/lib/i18n/provider"
import { useAuth } from "@/lib/auth/provider"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

type NavItem = { href: string; labelKey: string; icon: React.ComponentType<{ className?: string }> }

const patientNav: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/medications", labelKey: "nav.medications", icon: Pill },
  { href: "/chat", labelKey: "nav.chat", icon: MessageCircle },
  { href: "/adherence", labelKey: "nav.adherence", icon: CalendarHeart },
]

const familyNav: NavItem[] = [
  { href: "/family-dashboard", labelKey: "nav.dashboard", icon: HeartPulse },
  { href: "/chat", labelKey: "nav.chat", icon: MessageCircle },
]

const doctorNav: NavItem[] = [
  { href: "/doctor-dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/doctor-dashboard?tab=patients", labelKey: "nav.doctor", icon: Users },
]

function getNav(role?: string): NavItem[] {
  if (role === "family") return familyNav
  if (role === "doctor") return doctorNav
  return patientNav
}

export function AppShell({
  children,
  requireRole,
}: {
  children: React.ReactNode
  requireRole?: "patient" | "family" | "doctor"
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const { user, isAuthenticated, logout, setRole } = useAuth()

  useEffect(() => {
    // Auto-set demo role for direct page access (no real auth)
    if (!isAuthenticated && requireRole) {
      setRole(requireRole)
    }
  }, [isAuthenticated, requireRole, setRole])

  const nav = getNav(user?.role ?? requireRole)
  const initials = (user?.full_name ?? "AH")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border/60 lg:bg-card/40">
        <div className="flex h-16 items-center px-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const Icon = item.icon
            const cleanHref = item.href.split("?")[0]
            const active = pathname === cleanHref || pathname.startsWith(cleanHref + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border/60 p-3">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Settings className="size-4" />
            {t("common.settings")}
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <Logo size="sm" />
          </div>
          <div className="hidden flex-1 lg:block" />
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher compact />
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--risk-critical)]" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size-9 rounded-full p-0">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Profile menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold">{user?.full_name ?? "Demo"}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user?.phone}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 size-4" />
                    {t("common.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    router.push("/")
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md lg:hidden">
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {nav.slice(0, 4).map((item) => {
              const Icon = item.icon
              const cleanHref = item.href.split("?")[0]
              const active = pathname === cleanHref || pathname.startsWith(cleanHref + "/")
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </Link>
                </li>
              )
            })}
            <li>
              <Link
                href="/settings"
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium",
                  pathname === "/settings" ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Stethoscope className="size-5" />
                <span className="truncate">{t("common.settings")}</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
