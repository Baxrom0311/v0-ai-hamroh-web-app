"use client"

import { BellRing, MessageCircle, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"

export function LandingFeatures() {
  const { t } = useI18n()
  const items = [
    { icon: MessageCircle, titleKey: "landing.feature1Title", descKey: "landing.feature1Desc" },
    { icon: BellRing, titleKey: "landing.feature2Title", descKey: "landing.feature2Desc" },
    { icon: Users, titleKey: "landing.feature3Title", descKey: "landing.feature3Desc" },
  ]
  return (
    <section className="border-b border-border/60 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {items.map((it) => {
            const Icon = it.icon
            return (
              <article
                key={it.titleKey}
                className="group rounded-3xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40 md:p-8"
              >
                <span className="inline-grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-105">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{t(it.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(it.descKey)}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
