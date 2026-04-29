"use client"

import Link from "next/link"
import {
  ArrowRight,
  Bell,
  BellRing,
  Brain,
  HeartPulse,
  ListChecks,
  Pill,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n, type Locale } from "@/lib/i18n/provider"
import { BrandMark } from "@/components/shared/logo"

/**
 * Landing hero — modelled on the NoSkip-AI infographic:
 *   - Left column: "MUAMMO" (problem) stats with coral percentages
 *   - Centre: phone mockup floating in front of a soft bowl-of-Hygieia
 *     illustration (the medical caduceus reference)
 *   - Right column: "YECHIMGA TALAB" (demand) stats with blue badges
 *
 * On mobile every column stacks: hero copy → phone mockup → problem stats →
 * demand stats. Decorative SVGs are aria-hidden so they don't pollute the
 * accessible name tree.
 */
export function LandingHero() {
  const { t, locale } = useI18n()

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-secondary/60 via-background to-background">
      {/* Decorative soft blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      {/* Faint bowl-of-Hygieia behind the centre column on lg+ */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-primary/10 lg:block"
      >
        <BowlOfHygieiaIllustration className="h-[640px] w-[640px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-16 lg:px-6 lg:py-20">
        {/* Top: brand wordmark + tagline */}
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
            <BrandMark className="size-3.5" />
            {t("landing.heroBadge")}
          </span>
          <h1 className="text-balance break-words font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="w-full rounded-full px-6 sm:w-auto">
              <Link href="/register">
                {t("landing.heroCta")}
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full rounded-full px-6 sm:w-auto">
              <Link href="/login">{t("landing.heroSecondaryCta")}</Link>
            </Button>
          </div>
        </div>

        {/* Three-column infographic body. Mobile stacks: phone → problem →
            demand. lg+ fans the columns out around the phone. */}
        <div className="mt-12 grid gap-6 lg:mt-20 lg:grid-cols-12 lg:items-center lg:gap-8">
          <ProblemPanel locale={locale} className="order-2 min-w-0 lg:order-1 lg:col-span-4" />
          <PhoneMockup locale={locale} className="order-1 mx-auto min-w-0 lg:order-2 lg:col-span-4" />
          <DemandPanel locale={locale} className="order-3 min-w-0 lg:col-span-4" />
        </div>

        {/* Bottom: features + relevance band */}
        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-3">
          <RelevanceCard locale={locale} className="lg:col-span-1" />
          <QuoteCard locale={locale} className="lg:col-span-2" />
        </div>
      </div>
    </section>
  )
}

// =============================================================================
// PROBLEM (MUAMMO) — coral percentages
// =============================================================================

function ProblemPanel({ locale, className }: { locale: Locale; className?: string }) {
  const items = [
    {
      icon: Bell,
      pct: "68%",
      label:
        locale === "uz"
          ? "dorini unutadi"
          : locale === "ru"
            ? "забывают про дозу"
            : "forget a dose",
    },
    {
      icon: HeartPulse,
      pct: "74%",
      label:
        locale === "uz"
          ? "o'zini yaxshi his qilganda davolanishni to'xtatadi"
          : locale === "ru"
            ? "прерывают лечение, почувствовав себя лучше"
            : "stop treatment when they feel better",
    },
    {
      icon: ListChecks,
      pct: "75%",
      label:
        locale === "uz"
          ? "dori qabulini kuzatib bormaydi"
          : locale === "ru"
            ? "не отслеживают приём"
            : "don't track their intake",
    },
  ]

  return (
    <div className={className}>
      <SectionEyebrow
        icon={HeartPulse}
        label={locale === "uz" ? "Muammo" : locale === "ru" ? "Проблема" : "The problem"}
      />
      <ul className="mt-4 space-y-4">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <li key={it.pct} className="flex items-start gap-3 sm:gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary ring-1 ring-primary/15 sm:size-12">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold leading-none text-[color:var(--risk-critical)] sm:text-3xl">
                  {it.pct}
                </p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">{it.label}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// =============================================================================
// DEMAND (YECHIMGA TALAB) + features
// =============================================================================

function DemandPanel({ locale, className }: { locale: Locale; className?: string }) {
  const stats = [
    {
      icon: Smartphone,
      pct: "76%",
      label:
        locale === "uz"
          ? "ilovadan foydalanishga tayyor"
          : locale === "ru"
            ? "готовы пользоваться приложением"
            : "ready to use the app",
    },
    {
      icon: Brain,
      pct: "62%",
      label:
        locale === "uz"
          ? "AI asosidagi xulq tahliliga qiziqadi"
          : locale === "ru"
            ? "хотят AI-анализ поведения"
            : "want AI behaviour analysis",
    },
    {
      icon: Users,
      pct: "30%+",
      label:
        locale === "uz"
          ? "yaqinlariga signal yuborish motivatsion omil"
          : locale === "ru"
            ? "ценят сигнал близким как мотиватор"
            : "value alerting loved ones as a motivator",
    },
  ]

  const features = [
    {
      icon: BellRing,
      title:
        locale === "uz" ? "Smart Reminder" : locale === "ru" ? "Умные напоминания" : "Smart Reminder",
      desc:
        locale === "uz"
          ? "Eslatma emas — moslashuvchan yondashuv"
          : locale === "ru"
            ? "Не просто напоминания — адаптивный подход"
            : "Adaptive nudges, not just alarms",
    },
    {
      icon: Brain,
      title:
        locale === "uz" ? "AI Xulq Tahlili" : locale === "ru" ? "AI-анализ поведения" : "AI Behaviour Analysis",
      desc:
        locale === "uz"
          ? "Foydalanuvchi odatlarini tahlil qiladi"
          : locale === "ru"
            ? "Анализирует привычки пользователя"
            : "Learns the patient's habits",
    },
    {
      icon: TrendingUp,
      title:
        locale === "uz" ? "Tracking & Progress" : locale === "ru" ? "Прогресс" : "Tracking & Progress",
      desc:
        locale === "uz"
          ? "Dori qabulini kuzatish va tahlil"
          : locale === "ru"
            ? "Отслеживание и аналитика"
            : "Track adherence and analytics",
    },
    {
      icon: Users,
      title:
        locale === "uz" ? "Yaqinlarga Signal" : locale === "ru" ? "Сигнал близким" : "Loved-ones alerts",
      desc:
        locale === "uz"
          ? "Qo'llab-quvvatlash orqali motivatsiya"
          : locale === "ru"
            ? "Мотивация через поддержку"
            : "Motivation through support",
    },
  ]

  return (
    <div className={className}>
      <SectionEyebrow
        icon={Users}
        label={locale === "uz" ? "Yechimga talab" : locale === "ru" ? "Спрос на решение" : "Demand"}
      />
      <ul className="mt-4 space-y-4">
        {stats.map((it) => {
          const Icon = it.icon
          return (
            <li key={it.pct} className="flex items-start gap-3 sm:gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary ring-1 ring-primary/15 sm:size-12">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold leading-none text-[color:var(--risk-critical)] sm:text-3xl">
                  {it.pct}
                </p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">{it.label}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-primary">
          {locale === "uz"
            ? "Asosiy xususiyatlar"
            : locale === "ru"
              ? "Ключевые функции"
              : "Key features"}
        </p>
        <ul className="mt-3 space-y-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <li key={f.title} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs leading-snug text-muted-foreground">{f.desc}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

// =============================================================================
// PHONE MOCKUP (centre)
// =============================================================================

function PhoneMockup({ locale, className }: { locale: Locale; className?: string }) {
  const t = (uz: string, ru: string, en: string) =>
    locale === "uz" ? uz : locale === "ru" ? ru : en

  return (
    <div className={className}>
      <div className="relative mx-auto w-full max-w-[300px]">
        {/* Phone frame */}
        <div className="relative rounded-[2.4rem] border-[10px] border-foreground/90 bg-card shadow-2xl shadow-primary/15">
          {/* Notch */}
          <div className="absolute left-1/2 top-1.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-foreground/90" />

          <div className="space-y-3 p-3 pt-9">
            {/* Header inside phone */}
            <div className="flex items-center justify-between px-1">
              <span className="font-display text-sm font-bold tracking-tight text-foreground">
                NoSkip<span className="text-primary">-AI</span>
              </span>
              <Bell className="size-4 text-muted-foreground" />
            </div>

            {/* Next-dose card */}
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("Keyingi dori qabuli", "Следующий приём", "Next dose")}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-2xl font-bold leading-none tabular-nums text-foreground">
                    12:00
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">Paratsetamol 500mg</p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Pill className="size-4" />
                </span>
              </div>
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-[color:var(--risk-critical)] py-2 text-xs font-semibold text-white shadow-sm"
              >
                {t("Dorini qabul qildim ✓", "Принял лекарство ✓", "Marked as taken ✓")}
              </button>
            </div>

            {/* Progress card */}
            <div className="rounded-2xl border border-border/60 bg-card p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("Sizning progressingiz", "Ваш прогресс", "Your progress")}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <ProgressRing value={85} />
                <MiniBars />
              </div>
            </div>

            {/* AI insight card */}
            <div className="rounded-2xl border border-border/60 bg-card p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("AI tahlil natijasi", "Результат AI", "AI insight")}
              </p>
              <div className="mt-2 flex items-start gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <Brain className="size-4" />
                </span>
                <p className="text-xs leading-snug text-muted-foreground">
                  {t(
                    "Siz dori qabulini odatda vaqtida bajarasiz.",
                    "Обычно вы принимаете лекарство вовремя.",
                    "You usually take your meds on time.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressRing({ value }: { value: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative grid size-14 shrink-0 place-items-center">
      <svg viewBox="0 0 56 56" className="size-14 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-secondary" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-primary"
        />
      </svg>
      <span className="absolute font-display text-xs font-bold tabular-nums text-foreground">
        {value}%
      </span>
    </div>
  )
}

function MiniBars() {
  const data = [40, 65, 50, 80, 70, 95, 85]
  const labels = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]
  return (
    <div className="flex flex-1 items-end gap-1">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span
            className="w-full rounded-t bg-primary/70"
            style={{ height: `${(v / 100) * 36}px` }}
            aria-hidden
          />
          <span className="text-[9px] font-medium text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// AUX cards (relevance + quote)
// =============================================================================

function RelevanceCard({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <div
      className={
        "rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6 " + (className ?? "")
      }
    >
      <SectionEyebrow
        icon={TrendingUp}
        label={locale === "uz" ? "Aktuallik darajasi" : locale === "ru" ? "Актуальность" : "Relevance"}
      />
      <p className="mt-3 font-display text-3xl font-extrabold leading-none text-[color:var(--risk-critical)] sm:text-4xl">
        70–80%
      </p>
      <p className="mt-2 text-sm leading-snug text-muted-foreground">
        {locale === "uz"
          ? "Yuqori bozor ehtiyoji — surunkali bemorlarning katta qismi yechim qidirmoqda."
          : locale === "ru"
            ? "Высокий рыночный спрос — большинство пациентов ищут решение."
            : "High demand — most chronic-condition patients are looking for a solution."}
      </p>
    </div>
  )
}

function QuoteCard({ locale, className }: { locale: Locale; className?: string }) {
  const body =
    locale === "uz"
      ? "So'rov natijalariga ko'ra, foydalanuvchilarning 70%+ davolanish rejimini buzadi. 76% esa bu muammoni hal qiluvchi ilovadan foydalanishga tayyor."
      : locale === "ru"
        ? "По данным опроса, 70%+ пациентов нарушают режим лечения. 76% готовы пользоваться приложением, решающим эту проблему."
        : "Survey data shows 70%+ of patients break their treatment plan. 76% are ready to use an app that fixes this."
  const tagline =
    locale === "uz"
      ? "NoSkip-AI — dori qabulini unutishdan himoya qiluvchi aqlli yordamchingiz."
      : locale === "ru"
        ? "NoSkip-AI — умный помощник, который не даёт пропустить приём."
        : "NoSkip-AI — your smart helper that prevents missed doses."
  return (
    <div
      className={
        "relative rounded-2xl border border-primary/20 bg-gradient-to-br from-secondary/60 to-card p-5 shadow-sm sm:p-6 " +
        (className ?? "")
      }
    >
      <span
        aria-hidden
        className="absolute -left-1 -top-1 font-display text-6xl font-extrabold leading-none text-primary/20"
      >
        “
      </span>
      <p className="relative pl-6 text-sm leading-relaxed text-foreground sm:text-base">{body}</p>
      <p className="relative mt-3 pl-6 font-display text-sm font-bold text-primary sm:text-base">
        {tagline}
      </p>
    </div>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function SectionEyebrow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-7 place-items-center rounded-lg bg-secondary text-primary">
        <Icon className="size-3.5" />
      </span>
      <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">
        {label}
      </span>
    </div>
  )
}

function BowlOfHygieiaIllustration({ className }: { className?: string }) {
  // Soft, large decorative version of the brand mark — sits behind the phone
  // mockup on lg+ screens. Kept as a separate inline SVG so we can use a much
  // thinner stroke than the small logo (which would otherwise feel chunky at
  // this scale).
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Bowl */}
      <path d="M40 140 Q 120 230 200 140" />
      <path d="M36 140 H 204" />
      {/* Stem */}
      <path d="M120 140 V 30" />
      {/* Snake — coiled twice around stem */}
      <path d="M120 30 Q 80 40 88 60 Q 96 80 120 80 Q 144 80 136 100 Q 128 120 100 120 Q 84 130 96 138" />
      {/* Snake head */}
      <circle cx="120" cy="26" r="6" fill="currentColor" />
    </svg>
  )
}
