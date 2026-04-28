"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { useI18n } from "@/lib/i18n/provider"
import { useAuth } from "@/lib/auth/provider"

export function PublicNav() {
  const { t } = useI18n()
  const { isAuthenticated, user } = useAuth()

  const homeFor = (role: string | undefined) => {
    if (role === "doctor") return "/doctor"
    if (role === "family") return "/family"
    return "/dashboard"
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 md:px-6">
        <Logo />
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Button asChild size="sm" className="shrink-0">
              <Link href={homeFor(user?.role)}>{t("nav.dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{t("common.login")}</Link>
              </Button>
              <Button asChild size="sm" className="shrink-0 whitespace-nowrap">
                <Link href="/register">{t("common.register")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
