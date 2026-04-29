"use client"

import { Logo } from "@/components/shared/logo"
import { useI18n } from "@/lib/i18n/provider"

export function LandingFooter() {
  const { locale } = useI18n()
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 md:flex-row md:items-center lg:px-6">
        <div>
          <Logo size="sm" />
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {locale === "uz"
              ? "Toshkent, O'zbekiston · 2025"
              : locale === "ru"
                ? "Ташкент, Узбекистан · 2025"
                : "Tashkent, Uzbekistan · 2025"}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">
            {locale === "uz" ? "Maxfiylik" : locale === "ru" ? "Конфиденциальность" : "Privacy"}
          </a>
          <a href="#" className="hover:text-foreground">
            {locale === "uz" ? "Shartlar" : locale === "ru" ? "Условия" : "Terms"}
          </a>
          <a href="mailto:hello@noskip-ai.uz" className="hover:text-foreground">
            hello@noskip-ai.uz
          </a>
        </div>
      </div>
    </footer>
  )
}
