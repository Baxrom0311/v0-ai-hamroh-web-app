"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/provider"

export function LandingCta() {
  const { t } = useI18n()
  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/5 p-8 text-center md:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("landing.ctaTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-base text-muted-foreground">
              {t("landing.ctaDesc")}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/register">
                  {t("landing.heroCta")}
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full">
                <Link href="/login">{t("common.login")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
