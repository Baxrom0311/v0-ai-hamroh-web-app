"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Camera, ChevronRight, Flame, Loader2, MessageCircle, Pill, Plus, Sparkles, Users, Volume2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n/provider"
import { useAuth } from "@/lib/auth/provider"
import { api, type ApiRisk, type FamilyConnection, type MedicationPhotoVerification, type PatientAnalytics, type TodayDose } from "@/lib/api"
import type { Dose } from "@/lib/types"
import { formatLongDate, riskFromScore } from "@/lib/format"
import { RiskGauge } from "@/components/shared/risk-indicator"
import { MoodSelector, type Mood } from "@/components/shared/mood-selector"
import { cn } from "@/lib/utils"
import { fileToBase64 } from "@/lib/image-file"
import { speakText } from "@/lib/speech"

export function PatientDashboard() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const firstName = (user?.full_name ?? "Bemor").split(" ")[0]
  const [doses, setDoses] = useState<Dose[]>([])
  const [analytics, setAnalytics] = useState<PatientAnalytics | null>(null)
  const [risk, setRisk] = useState<ApiRisk | null>(null)
  const [family, setFamily] = useState<FamilyConnection[]>([])
  const [moodReply, setMoodReply] = useState<string | null>(null)
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [verificationByDose, setVerificationByDose] = useState<Record<number, MedicationPhotoVerification>>({})
  const [verifyingDoseId, setVerifyingDoseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadDashboard() {
      setLoading(true)
      setError(null)
      try {
        const [today, analyticsData, riskData, familyData] = await Promise.all([
          api.todayDoses(),
          api.patientAnalytics(),
          api.currentRisk(),
          api.familyList().catch(() => []),
        ])
        if (cancelled) return
        setDoses(today.map(mapDose))
        setAnalytics(analyticsData)
        setRisk(riskData)
        setFamily(familyData)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Dashboard yuklanmadi")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  const taken = doses.filter((d) => d.status === "taken" || d.status === "late").length
  const total = doses.length
  const score = Math.round(risk?.risk_score ?? analytics?.risk.current_score ?? 0)
  const riskLevel = risk?.risk_level ?? analytics?.risk.current_level ?? riskFromScore(score)
  const isCritical = score >= 60 || riskLevel === "high" || riskLevel === "critical"
  const riskFactors = riskTextFactors(risk)
  const predictiveAlerts = doses.filter((dose) => dose.is_predictive_alert && dose.alert_message)

  const todayLabel = useMemo(() => formatLongDate(new Date(), locale), [locale])

  async function refreshToday() {
    const [today, analyticsData, riskData] = await Promise.all([
      api.todayDoses(),
      api.patientAnalytics(),
      api.currentRisk(),
    ])
    setDoses(today.map(mapDose))
    setAnalytics(analyticsData)
    setRisk(riskData)
  }

  async function handleTake(dose: Dose) {
    const previous = doses
    setDoses((prev) =>
      prev.map((d) =>
        d.id === dose.id ? { ...d, status: "taken" as const, taken_at: new Date().toISOString() } : d,
      ),
    )
    try {
      await api.logDoseTaken({
        medication_id: dose.medication_id,
        scheduled_time: dose.scheduled_at ?? scheduledIsoFromTime(dose.scheduled_time),
        taken_at: new Date().toISOString(),
      })
      await refreshToday()
      toast.success(locale === "uz" ? "Doza saqlandi" : locale === "ru" ? "Доза сохранена" : "Dose saved")
    } catch (err) {
      setDoses(previous)
      toast.error(err instanceof Error ? err.message : "Xatolik")
    }
  }

  async function handleMiss(dose: Dose) {
    const previous = doses
    setDoses((prev) => prev.map((d) => (d.id === dose.id ? { ...d, status: "missed" as const } : d)))
    try {
      await api.markDoseMissed({
        medication_id: dose.medication_id,
        scheduled_time: dose.scheduled_at ?? scheduledIsoFromTime(dose.scheduled_time),
      })
      await refreshToday()
      toast.success(t("dashboard.missed"))
    } catch (err) {
      setDoses(previous)
      toast.error(err instanceof Error ? err.message : "Xatolik")
    }
  }

  async function handleMood(m: Mood) {
    setSelectedMood(m)
    setMoodReply(t("chat.aiThinking"))
    try {
      const response = await api.checkIn(toApiMood(m), t(`dashboard.mood${capitalize(m)}`))
      setMoodReply(response.ai_response)
      if (m === "tired" || m === "sick") await refreshToday()
    } catch (err) {
      setMoodReply(err instanceof Error ? err.message : "AI javob bermadi")
    }
  }

  function speakReminder(message: string) {
    if (!speakText(message, locale)) {
      toast.error(locale === "uz" ? "Brauzer ovozli o'qishni qo'llab-quvvatlamaydi" : "Voice is not supported")
    }
  }

  async function handleVerifyPhoto(dose: Dose, file: File) {
    setVerifyingDoseId(dose.id)
    try {
      const imageBase64 = await fileToBase64(file)
      const result = await api.verifyMedicationPhoto({
        image_base64: imageBase64,
        mime_type: file.type || "image/jpeg",
        medication_id: dose.medication_id,
      })
      setVerificationByDose((prev) => ({ ...prev, [dose.id]: result }))
      toast.success(result.patient_message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rasm tekshirilmadi")
    } finally {
      setVerifyingDoseId(null)
    }
  }

  return (
    <>
      {isCritical && <CriticalBanner />}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{todayLabel}</p>
          <h1 className="mt-1 text-balance text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            {t("dashboard.greeting", { name: firstName + (locale === "uz" ? " opa" : "") })}
          </h1>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full sm:size-default">
          <Link href="/medications/add">
            <Plus className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">{t("dashboard.addMedication")}</span>
          </Link>
        </Button>
      </header>

      {error && (
        <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-accent/40 via-card to-card p-5 shadow-sm sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {locale === "uz" ? "Bugungi holat" : locale === "ru" ? "Сегодня" : "Today"}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">{t("dashboard.moodPrompt")}</h2>
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
                  <Link href="/chat">{t("chat.title")}</Link>
                </Button>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("dashboard.todayMeds")}</h2>
              <p className="text-sm text-muted-foreground">{t("dashboard.progressToday", { taken, total })}</p>
            </div>
            <ProgressRing value={total ? (taken / total) * 100 : 0} />
          </div>
          {predictiveAlerts.length > 0 && (
            <div className="mt-4 rounded-2xl border border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10 p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--risk-high)]/15 text-[var(--risk-high)]">
                  <AlertTriangle className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Predictive missed-dose alert</p>
                  <p className="mt-1 text-sm text-muted-foreground">{predictiveAlerts[0].alert_message}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full bg-transparent"
                  onClick={() => speakReminder(predictiveAlerts[0].alert_message || "")}
                >
                  <Volume2 className="mr-1 size-4" />
                  Ovoz
                </Button>
              </div>
            </div>
          )}
          {loading ? (
            <p className="mt-4 rounded-2xl bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          ) : doses.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
              <p className="font-medium text-foreground">{t("dashboard.noMeds")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.noMedsDesc")}</p>
              <Button asChild className="mt-4 rounded-xl">
                <Link href="/medications/add">{t("dashboard.addMedication")}</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {doses.map((dose) => (
                <DoseItem
                  key={dose.id}
                  dose={dose}
                  onTake={handleTake}
                  onMiss={handleMiss}
                  onSpeak={speakReminder}
                  onVerifyPhoto={handleVerifyPhoto}
                  verification={verificationByDose[dose.id]}
                  verifying={verifyingDoseId === dose.id}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">{t("dashboard.riskTitle")}</h2>
          <div className="mt-2 flex flex-col items-center">
            <RiskGauge score={score} size={170} thickness={14} />
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
              {riskFactors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </details>
        </section>

        <StreakCard analytics={analytics} />
        <FamilyCard connections={family} />
      </div>

      <button
        type="button"
        onClick={() => router.push("/chat")}
        className={cn(
          "fixed bottom-20 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95 sm:px-5",
          "lg:bottom-8 lg:right-8",
          isCritical && "animate-pulse-ring",
        )}
        aria-label={t("dashboard.aiCompanion")}
      >
        <MessageCircle className="size-4" />
        <span className="hidden text-sm font-semibold sm:inline">{t("dashboard.aiCompanion")}</span>
      </button>
    </>
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
        <p className="text-sm font-semibold text-foreground">{t("dashboard.criticalBanner")}</p>
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

function DoseItem({
  dose,
  onTake,
  onMiss,
  onSpeak,
  onVerifyPhoto,
  verification,
  verifying,
}: {
  dose: Dose
  onTake: (d: Dose) => void
  onMiss: (d: Dose) => void
  onSpeak: (message: string) => void
  onVerifyPhoto: (d: Dose, file: File) => void
  verification?: MedicationPhotoVerification
  verifying?: boolean
}) {
  const { t, locale } = useI18n()
  const isTaken = dose.status === "taken" || dose.status === "late"
  const isMissed = dose.status === "missed"
  const isUpcoming = dose.status === "upcoming"

  const now = new Date()
  const sched = dose.scheduled_at ? new Date(dose.scheduled_at) : new Date(scheduledIsoFromTime(dose.scheduled_time))
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
            <p className="text-xs font-semibold tabular-nums text-muted-foreground">{dose.scheduled_time}</p>
            {isTaken && dose.taken_at && (
              <span className="text-[11px] text-muted-foreground">
                · {new Date(dose.taken_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <p className="truncate text-sm font-medium text-foreground">
            {dose.medication_name} {dose.dosage}
          </p>
          {dose.instructions && !isTaken && <p className="text-xs text-muted-foreground">{dose.instructions}</p>}
        </div>
        {isTaken && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--risk-low)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--risk-low)]">
            ✓ {t("dashboard.taken")}
          </span>
        )}
      </div>

      {dose.alert_message && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--risk-high)]/25 bg-[var(--risk-high)]/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--risk-high)]" />
          <p className="text-xs leading-relaxed text-foreground">{dose.alert_message}</p>
        </div>
      )}

      {verification && (
        <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={verification.medication_match === "yes" ? "default" : verification.medication_match === "no" ? "destructive" : "secondary"}>
              Photo: {verification.medication_match}
            </Badge>
            <span className="text-muted-foreground">{verification.confidence}% confidence</span>
          </div>
          <p className="mt-1 text-foreground">{verification.patient_message}</p>
          {verification.observations.length > 0 && (
            <p className="mt-1 text-muted-foreground">{verification.observations.slice(0, 2).join(" · ")}</p>
          )}
        </div>
      )}

      {(isUpcoming || isMissed) && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => onTake(dose)} size="sm" className="h-9 flex-1 rounded-xl text-sm font-semibold sm:flex-none sm:px-5">
            ✓ {isMissed ? (locale === "uz" ? "Hozir ichdim" : locale === "ru" ? "Принял сейчас" : "Took now") : t("dashboard.tookIt")}
          </Button>
          {isUpcoming && (
            <Button onClick={() => onMiss(dose)} size="sm" variant="ghost" className="h-9 rounded-xl text-xs text-muted-foreground">
              {t("dashboard.skip")}
            </Button>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 rounded-xl bg-transparent text-xs"
          onClick={() => onSpeak(dose.alert_message || `${dose.scheduled_time} da ${dose.medication_name} ${dose.dosage} ichish vaqti.`)}
        >
          <Volume2 className="mr-1 size-3.5" />
          Voice reminder
        </Button>
        <label className={cn(
          "inline-flex h-9 cursor-pointer items-center rounded-xl border border-border bg-background px-3 text-xs font-medium hover:bg-muted",
          verifying && "pointer-events-none opacity-60",
        )}>
          {verifying ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <Camera className="mr-1 size-3.5" />}
          Photo verify
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) onVerifyPhoto(dose, file)
            }}
          />
        </label>
      </div>
    </li>
  )
}

function StreakCard({ analytics }: { analytics: PatientAnalytics | null }) {
  const { t, locale } = useI18n()
  const days = analytics?.week.by_day ?? []
  const last7 = days.length ? days.map((day) => day.rate >= 80) : Array.from({ length: 7 }, () => false)
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{t("dashboard.streakTitle")}</h2>
      <div className="mt-3 flex items-baseline gap-2">
        <Flame className="size-7 text-[var(--risk-high)]" />
        <span className="text-4xl font-bold tabular-nums text-foreground">{analytics?.streak.current ?? 0}</span>
        <span className="text-sm text-muted-foreground">{t("dashboard.streakDays")}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("dashboard.bestStreak")}: {analytics?.streak.longest ?? 0} {t("dashboard.streakDays")}
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

function FamilyCard({ connections }: { connections: FamilyConnection[] }) {
  const { t, locale } = useI18n()
  const members = connections
    .filter((connection) => connection.role_in_connection === "patient" && connection.family_member)
    .map((connection) => ({ ...connection.family_member!, relationship: connection.relationship }))

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{t("dashboard.familyTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.familySupport", { n: members.length })}</p>
      {members.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
          {locale === "uz" ? "Hali yaqinlar ulanmagan" : locale === "ru" ? "Близкие ещё не подключены" : "No family connected yet"}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/30 px-3 py-2">
              <Avatar className="size-9">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                  {initials(member.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{member.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.relationship}</p>
              </div>
              <Users className="size-4 text-muted-foreground" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function mapDose(dose: TodayDose, index: number): Dose {
  return {
    id: index + 1,
    medication_id: dose.medication_id,
    medication_name: dose.name,
    dosage: dose.dosage,
    scheduled_time: formatTime(dose.scheduled_time),
    scheduled_at: dose.scheduled_time,
    status: dose.status,
    instructions: dose.instructions ?? undefined,
    is_predictive_alert: dose.is_predictive_alert,
    minutes_late: dose.minutes_late,
    alert_message: dose.alert_message,
  }
}

function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(11, 16)
  return date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function scheduledIsoFromTime(time: string) {
  const [h, m] = time.split(":").map(Number)
  const date = new Date()
  date.setHours(h || 0, m || 0, 0, 0)
  return date.toISOString()
}

function toApiMood(mood: Mood): "good" | "tired" | "sick" {
  if (mood === "sick") return "sick"
  if (mood === "tired" || mood === "meh") return "tired"
  return "good"
}

function riskTextFactors(risk: ApiRisk | null) {
  const factors = risk?.factors?.map((factor) => {
    if (typeof factor === "string") return factor
    return factor.label ?? factor.description ?? factor.reason ?? factor.name ?? JSON.stringify(factor)
  })
  if (factors?.length) return factors
  if (risk?.ai_analysis) return [risk.ai_analysis]
  return ["Hozircha xavf omillari topilmadi"]
}

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}
