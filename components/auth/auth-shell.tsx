"use client"

import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { useI18n } from "@/lib/i18n/provider"

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n()
  return (
    <div className="relative flex min-h-svh flex-col bg-gradient-to-br from-accent/40 via-background to-secondary/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(circle at 10% 0%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 50%)",
        }}
      />
      <header className="relative z-10 flex items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-block"
          >
            {locale === "uz" ? "Bosh sahifaga" : locale === "ru" ? "На главную" : "Home"}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
