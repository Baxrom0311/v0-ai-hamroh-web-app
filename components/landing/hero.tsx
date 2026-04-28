"use client"

import Link from "next/link"
import { ArrowRight, BellRing, Heart, MessageCircle, Pill, ShieldCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/provider"

export function LandingHero() {
  const { t, locale } = useI18n()

  const trustChips: { label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      label: locale === "uz" ? "Maxfiy va xavfsiz" : locale === "ru" ? "Конфиденциально" : "Private & secure",
      icon: ShieldCheck,
    },
    {
      label: locale === "uz" ? "3 tilda" : locale === "ru" ? "На 3 языках" : "3 languages",
      icon: Heart,
    },
    {
      label: locale === "uz" ? "Telegram bilan ishlaydi" : locale === "ru" ? "Работает с Telegram" : "Works with Telegram",
      icon: BellRing,
    },
  ]

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-accent/40 via-background to-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[920px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:py-20 lg:grid-cols-12 lg:gap-12 lg:py-24 lg:px-6">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Heart className="size-3.5 fill-current" strokeWidth={0} />
            {locale === "uz"
              ? "O'zbekiston uchun aqlli sog'liq yordamchisi"
              : locale === "ru"
                ? "Умный медицинский помощник для Узбекистана"
                : "Smart health companion for Uzbekistan"}
          </span>
          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/register">
                {t("landing.heroCta")}
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link href="/login">
                {t("landing.heroSecondaryCta")}
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {trustChips.map((c) => {
              const Icon = c.icon
              return (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Icon className="size-3.5 text-primary" />
                  {c.label}
                </span>
              )
            })}
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <HeroPreview />
        </div>
      </div>
    </section>
  )
}

function HeroPreview() {
  const { t, locale } = useI18n()
  const greet =
    locale === "uz" ? "Salom, Aziza opa!" : locale === "ru" ? "Здравствуйте, Азиза!" : "Hi, Aziza!"
  const aiReply =
    locale === "uz"
      ? "Charchoqdan xavotirlanmang — bu normal. Bitta dozani o'tkazib yubormaylik."
      : locale === "ru"
        ? "Не беспокойтесь об усталости — это нормально. Не пропустим ни одной дозы."
        : "Don't worry about fatigue — it's normal. Let's not skip a dose."

  return (
    <div className="relative">
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-xl shadow-primary/5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greet}</p>
            <p className="text-base font-semibold text-foreground">{t("dashboard.todayMeds")}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            3/5 {locale === "uz" ? "ichilgan" : locale === "ru" ? "принято" : "taken"}
          </span>
        </div>
        <div className="mt-5 space-y-2.5">
          <DoseRow time="08:00" name="Изониазид 300mg" status="taken" />
          <DoseRow time="08:00" name="Рифампицин 600mg" status="taken" />
          <DoseRow time="14:00" name="Pyrazinamide 1500mg" status="taken" />
          <DoseRow time="20:00" name="Изониазид 300mg" status="upcoming" highlight />
        </div>
      </div>

      <div className="absolute -left-4 -bottom-6 w-[88%] rotate-[-2deg] rounded-2xl border border-border/60 bg-card p-4 shadow-lg sm:w-[78%]">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <MessageCircle className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">{t("chat.title")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{aiReply}</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 -top-4 hidden items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-md sm:inline-flex">
        <Users className="size-3.5 text-primary" />
        {locale === "uz" ? "Bobur va 1 yaqin kuzatmoqda" : locale === "ru" ? "Бобур и 1 близкий рядом" : "Bobur + 1 supporting"}
      </div>
    </div>
  )
}

function DoseRow({
  time,
  name,
  status,
  highlight,
}: {
  time: string
  name: string
  status: "taken" | "upcoming"
  highlight?: boolean
}) {
  const { locale } = useI18n()
  const isTaken = status === "taken"
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
        highlight ? "border-primary/30 bg-primary/5" : "border-border/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-lg bg-muted text-foreground">
          <Pill className="size-4" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground tabular-nums">{time}</p>
          <p className="text-sm font-medium text-foreground">{name}</p>
        </div>
      </div>
      {isTaken ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--risk-low)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--risk-low)]">
          ✓ {locale === "uz" ? "Ichildi" : locale === "ru" ? "Принято" : "Taken"}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
          {locale === "uz" ? "Yaqinda" : locale === "ru" ? "Скоро" : "Soon"}
        </span>
      )}
    </div>
  )
}
