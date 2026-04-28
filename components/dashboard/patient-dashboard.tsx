"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, ChevronRight, Flame, MessageCircle, Pill, Plus, Sparkles, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n/provider"
import { useAuth } from "@/lib/auth/provider"
import {
  MOCK_FAMILY,
  MOCK_RISK,
  MOCK_TODAY_DOSES,
} from "@/lib/mock-data"
import type { Dose } from "@/lib/types"
import { formatLongDate, riskFromScore } from "@/lib/format"
import { RiskGauge } from "@/components/shared/risk-indicator"
import { MoodSelector, type Mood } from "@/components/shared/mood-selector"
import { cn } from "@/lib/utils"

export function PatientDashboard() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const firstName = (user?.full_name ?? "Aziza Karimova").split(" ")[0]
  const [doses, setDoses] = useState<Dose[]>(MOCK_TODAY_DOSES)
  const [moodReply, setMoodReply] = useState<string | null>(null)
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)

  const taken = doses.filter((d) => d.status === "taken").length
  const total = doses.length
  const risk = MOCK_RISK
  const riskLevel = riskFromScore(risk.score)
  const isCritical = risk.score >= 60

  const todayLabel = useMemo(() => formatLongDate(new Date(), locale), [locale])

  function handleTake(dose: Dose) {
    setDoses((prev) =>
      prev.map((d) =>
        d.id === dose.id
          ? { ...d, status: "taken" as const, taken_at: new Date().toISOString() }
          : d,
      ),
    )
    toast.success(
      locale === "uz"
        ? "Ajoyib! Davom eting"
        : locale === "ru"
          ? "Отлично! Продолжайте"
          : "Great! Keep going",
    )
  }

  function handleMood(m: Mood) {
    setSelectedMood(m)
    const responses: Record<Mood, Record<string, string>> = {
      great: {
        uz: "Ajoyib! Bugun ham kunni yaxshi o'tkazasiz.",
        ru: "Замечательно! Хорошего вам дня.",
        en: "Wonderful! Have a great day.",
      },
      ok: {
        uz: "Yaxshi. Esda tuting — har bir doza muhim.",
        ru: "Хорошо. Помните — каждая доза важна.",
        en: "Good. Remember — every dose matters.",
      },
      meh: {
        uz: "Tushundim. Suv ichib, biroz dam oling. Dorini unutmang.",
        ru: "Понимаю. Попейте воды, отдохните. Не забудьте про лекарство.",
        en: "I hear you. Drink water, rest a bit. Don't forget your dose.",
      },
      tired: {
        uz: "Charchadingiz. Bu normal — TB davolanishida tez-tez bo'ladi. Kichik tanaffus oling.",
        ru: "Вы устали. Это нормально при лечении ТБ. Сделайте короткую паузу.",
        en: "You're tired. That's normal during TB treatment. Take a small break.",
      },
      sick: {
        uz: "Sizni eshitaman. Bobur akangizga xabar beray, sizni qo'llab-quvvatlasin?",
        ru: "Слышу вас. Сообщить Бобуру, чтобы поддержал?",
        en: "I hear you. Should I let Bobur know so he can support you?",
      },
    }
    setMoodReply(responses[m][locale] ?? responses[m].uz)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8 lg:py-10">
      {isCritical && <CriticalBanner />}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{todayLabel}</p>
          <h1 className="mt-1 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("dashboard.greeting", { name: firstName + (locale === "uz" ? " opa" : "") })}
          </h1>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/medications/new">
            <Plus className="mr-1 size-4" />
            {t("dashboard.addMedication")}
          </Link>
        </Button>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {/* Mood Card */}
        <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-accent/40 via-card to-card p-5 shadow-sm sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {locale === "uz" ? "Bugungi holat" : locale === "ru" ? "Сегодня" : "Today"}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {t("dashboard.moodPrompt")}
              </h2>
            </div>
          </div>
          <div className="mt-4">
            <MoodSelector onSelect={handleMood} />
          </div>
          {moodReply && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-primary">{t("chat.title")}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-foreground">{moodReply}</p>
              </div>
              {selectedMood === "tired" || selectedMood === "sick" ? (
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link href="/chat">
                    {t("chat.title")}
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
        </section>

        {/* Today's Meds */}
        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("dashboard.todayMeds")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.progressToday", { taken, total })}
              </p>
            </div>
            <ProgressRing value={(taken / total) * 100} />
          </div>
          <ul className="mt-4 space-y-2">
            {doses.map((dose) => (
              <DoseItem key={dose.id} dose={dose} onTake={handleTake} />
            ))}
          </ul>
        </section>

        {/* Risk */}
        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">{t("dashboard.riskTitle")}</h2>
          <div className="mt-2 flex flex-col items-center">
            <RiskGauge score={risk.score} size={170} thickness={14} />
            <p className="mt-3 text-center text-sm font-medium text-foreground">
              {t(`dashboard.risk${capitalize(riskLevel)}`)}
            </p>
          </div>
          <details className="mt-4 group">
            <summary className="flex cursor-pointer items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                {t("dashboard.riskAnalysis")}
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
            </summary>
            <ul className="mt-3 space-y-2">
              {risk.factors.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
          </details>
        </section>

        {/* Streak */}
        <StreakCard />

        {/* Family */}
        <FamilyCard />
      </div>

      {/* AI Companion FAB */}
      <button
        type="button"
        onClick={() => router.push("/chat")}
        className={cn(
          "fixed bottom-20 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95",
          "lg:bottom-8 lg:right-8",
          isCritical && "animate-pulse-ring",
        )}
        aria-label={t("dashboard.aiCompanion")}
      >
        <MessageCircle className="size-4" />
        <span className="text-sm font-semibold">{t("dashboard.aiCompanion")}</span>
      </button>
    </div>
  )
}

function CriticalBanner() {
  const { t } = useI18n()
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--risk-high)]/20 text-[var(--risk-high)]">
          <AlertTriangle className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{t("dashboard.criticalBanner")}</p>
        </div>
      </div>
      <Button asChild size="sm" className="rounded-full">
        <Link href="/chat">{t("dashboard.talkNow")}</Link>
      </Button>
    </div>
  )
}

function ProgressRing({ value }: { value: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative size-14 shrink-0">
      <svg width={56} height={56} className="-rotate-90">
        <circle cx={28} cy={28} r={r} fill="none" stroke="var(--muted)" strokeWidth={5} />
        <circle
          cx={28}
          cy={28}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={5}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-semibold tabular-nums text-foreground">
        {Math.round(value)}%
      </span>
    </div>
  )
}

function DoseItem({ dose, onTake }: { dose: Dose; onTake: (d: Dose) => void }) {
  const { t, locale } = useI18n()
  const isTaken = dose.status === "taken"
  const isMissed = dose.status === "missed"
  const isUpcoming = dose.status === "upcoming"

  // Highlight if scheduled within next 2 hours
  const now = new Date()
  const [h, m] = dose.scheduled_time.split(":").map(Number)
  const sched = new Date()
  sched.setHours(h, m, 0, 0)
  const diffMin = (sched.getTime() - now.getTime()) / 60000
  const isNow = isUpcoming && diffMin >= -30 && diffMin <= 60

  return (
    <li
      className={cn(
        "rounded-2xl border px-3 py-3 transition-colors sm:px-4",
        isTaken && "border-border/40 bg-muted/30",
        isMissed && "border-[var(--risk-high)]/40 bg-[var(--risk-high)]/5",
        isUpcoming && !isNow && "border-border/60 bg-card",
        isNow && "border-primary/40 bg-primary/5 ring-2 ring-primary/15 animate-pulse-ring",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            isTaken
              ? "bg-[var(--risk-low)]/15 text-[var(--risk-low)]"
              : isMissed
                ? "bg-[var(--risk-high)]/15 text-[var(--risk-high)]"
                : "bg-primary/15 text-primary",
          )}
        >
          <Pill className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tabular-nums text-muted-foreground">
              {dose.scheduled_time}
            </p>
            {isTaken && dose.taken_at && (
              <span className="text-[11px] text-muted-foreground">
                · {new Date(dose.taken_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <p className="truncate text-sm font-medium text-foreground">
            {dose.medication_name} {dose.dosage}
          </p>
          {dose.instructions && !isTaken && (
            <p className="text-xs text-muted-foreground">{dose.instructions}</p>
          )}
        </div>
        {isTaken && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--risk-low)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--risk-low)]">
            ✓ {t("dashboard.taken")}
          </span>
        )}
      </div>

      {isUpcoming && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() => onTake(dose)}
            size="sm"
            className={cn("h-9 flex-1 rounded-xl text-sm font-semibold sm:flex-none sm:px-5")}
          >
            ✓ {t("dashboard.tookIt")}
          </Button>
          <Button size="sm" variant="ghost" className="h-9 rounded-xl text-xs">
            {t("dashboard.snooze")}
          </Button>
          <Button size="sm" variant="ghost" className="h-9 rounded-xl text-xs text-muted-foreground">
            {t("dashboard.skip")}
          </Button>
        </div>
      )}

      {isMissed && (
        <div className="mt-3">
          <Button
            onClick={() => onTake(dose)}
            size="sm"
            variant="outline"
            className="w-full rounded-xl"
          >
            {locale === "uz"
              ? "Hech bo'lmaganda hozir ich"
              : locale === "ru"
                ? "Принять сейчас"
                : "Take now"}
          </Button>
        </div>
      )}
    </li>
  )
}

function StreakCard() {
  const { t, locale } = useI18n()
  const last7: boolean[] = [true, true, false, true, true, true, true]
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{t("dashboard.streakTitle")}</h2>
      <div className="mt-3 flex items-baseline gap-2">
        <Flame className="size-7 text-[var(--risk-high)]" />
        <span className="text-4xl font-bold tabular-nums text-foreground">5</span>
        <span className="text-sm text-muted-foreground">{t("dashboard.streakDays")}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("dashboard.bestStreak")}: 12 {t("dashboard.streakDays")}
      </p>
      <div className="mt-4 flex items-center gap-1.5">
        {last7.map((ok, i) => (
          <div
            key={i}
            className={cn(
              "h-8 flex-1 rounded-md",
              ok ? "bg-[var(--risk-low)]/30 ring-1 ring-[var(--risk-low)]/40" : "bg-muted",
            )}
            title={`${locale === "uz" ? "Kun" : "Day"} ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

function FamilyCard() {
  const { t, locale } = useI18n()
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{t("dashboard.familyTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("dashboard.familySupport", { n: MOCK_FAMILY.length })}
      </p>
      <ul className="mt-4 space-y-2">
        {MOCK_FAMILY.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/30 px-3 py-2"
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                {m.full_name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{m.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{m.relationship}</p>
            </div>
            <Users className="size-4 text-muted-foreground" />
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="mt-3 w-full rounded-xl">
        {locale === "uz" ? "Yaqin qo'shish" : locale === "ru" ? "Добавить" : "Add"}
      </Button>
    </section>
  )
}

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}
