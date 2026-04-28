"use client"

import { useI18n } from "@/lib/i18n/provider"

export function LandingStats() {
  const { t } = useI18n()
  const stats = [
    { num: t("landing.stat1Number"), label: t("landing.stat1Label") },
    { num: t("landing.stat2Number"), label: t("landing.stat2Label") },
    { num: t("landing.stat3Number"), label: t("landing.stat3Label") },
  ]
  return (
    <section className="border-b border-border/60 bg-secondary/40 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("landing.statsTitle")}
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-3xl border border-border/60 bg-card p-6 text-center md:p-8"
            >
              <p className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">{s.num}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
