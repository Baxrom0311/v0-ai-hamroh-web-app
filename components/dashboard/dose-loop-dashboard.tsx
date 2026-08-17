"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageCircle,
  Pill,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/provider"
import {
  api,
  type ApiRisk,
  type MedicationIntelligence,
  type PatientAnalytics,
  type RiskLevel,
  type TodayDose,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const COMPLETED_STATUSES = new Set(["taken", "late", "skipped"])

const helpReasons = [
  {
    label: "Yon ta'sir bezovta qilyapti",
    prompt: "Bugun dori ichishda yon ta'sir bezovta qilyapti. Menga nima qilishni qisqa tushuntiring.",
  },
  {
    label: "Dorini unutdim",
    prompt: "Bugun dori ichishni unutdim. Endi nima qilishim kerak?",
  },
  {
    label: "To'xtatmoqchiman",
    prompt: "Charchadim, davolanishni to'xtatmoqchiman. Sababini aniqlashga yordam bering.",
  },
  {
    label: "Qaysi dorini ichishni bilmadim",
    prompt: "Dorilarim chalkashib ketdi. Qaysi dorini qachon ichishni tushunishga yordam bering.",
  },
]

export function DoseLoopDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const firstName = (user?.full_name ?? "Bemor").split(" ")[0]
  const [doses, setDoses] = useState<TodayDose[]>([])
  const [analytics, setAnalytics] = useState<PatientAnalytics | null>(null)
  const [risk, setRisk] = useState<ApiRisk | null>(null)
  const [medicationIntelligence, setMedicationIntelligence] = useState<MedicationIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [today, analyticsData, riskData, intelligenceData] = await Promise.all([
        api.todayDoses(),
        api.patientAnalytics().catch(() => null),
        api.currentRisk().catch(() => null),
        api.medicationIntelligence(true).catch(() => null),
      ])
      setDoses(sortDoses(today))
      setAnalytics(analyticsData)
      setRisk(riskData)
      setMedicationIntelligence(intelligenceData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dashboard yuklanmadi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nextDose = useMemo(() => doses.find((dose) => !COMPLETED_STATUSES.has(dose.status)) ?? null, [doses])
  const completed = doses.filter((dose) => COMPLETED_STATUSES.has(dose.status)).length
  const missed = doses.filter((dose) => dose.status === "missed").length
  const total = doses.length
  const progress = total ? Math.round((completed / total) * 100) : 0
  const riskScore = Math.round(risk?.risk_score ?? analytics?.risk.current_score ?? 0)
  const riskLevel = risk?.risk_level ?? analytics?.risk.current_level ?? "low"
  const needsSupport = riskLevel === "high" || riskLevel === "critical" || missed > 0

  async function markTaken(dose: TodayDose) {
    const key = `taken:${dose.medication_id}:${dose.scheduled_time}`
    setBusyKey(key)
    try {
      await api.logDoseTaken({
        medication_id: dose.medication_id,
        scheduled_time: dose.scheduled_time,
        taken_at: new Date().toISOString(),
      })
      toast.success("Doza saqlandi")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Doza saqlanmadi")
    } finally {
      setBusyKey(null)
    }
  }

  async function markMissed(dose: TodayDose) {
    const key = `missed:${dose.medication_id}:${dose.scheduled_time}`
    setBusyKey(key)
    try {
      await api.markDoseMissed({
        medication_id: dose.medication_id,
        scheduled_time: dose.scheduled_time,
        notes: "patient_reported_problem",
      })
      toast.success("Muammo qayd qilindi")
      await load()
      openHelp("Bugun dozani vaqtida icholmadim. Sababini topishga yordam bering.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Muammo saqlanmadi")
    } finally {
      setBusyKey(null)
    }
  }

  function openHelp(prompt: string) {
    window.sessionStorage.setItem("noskipai-chat-draft", prompt)
    router.push("/chat")
  }

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-accent/35 to-background p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
              NoSkipAI Dose Loop
            </Badge>
            <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {firstName}, bugun faqat bitta savol: dori ichildimi?
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Asosiy oqim sodda: keyingi dozani ko'rasiz, ichgan bo'lsangiz belgilaysiz, muammo bo'lsa AI sababni aniqlab yordam beradi.
            </p>
          </div>
          <Button variant="outline" className="rounded-full bg-background/70" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
            Yangilash
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Keyingi qadam</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Bugungi keyingi doza</h2>
            </div>
            <Pill className="size-6 text-primary" />
          </div>

          {loading ? (
            <div className="mt-6 rounded-3xl bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              Yuklanmoqda...
            </div>
          ) : !total ? (
            <EmptyDosePlan />
          ) : nextDose ? (
            <NextDoseCard
              dose={nextDose}
              busyKey={busyKey}
              onTaken={() => markTaken(nextDose)}
              onMissed={() => markMissed(nextDose)}
              onHelp={() => openHelp(`Bugungi ${nextDose.name} dozasini ichishda muammo bor. Menga yordam bering.`)}
            />
          ) : (
            <AllDoneCard />
          )}
        </section>

        <aside className="space-y-5">
          <TodayProgress completed={completed} total={total} missed={missed} progress={progress} />
          <RiskSummary score={riskScore} level={riskLevel} needsSupport={needsSupport} onHelp={() => openHelp("Bugungi riskim oshgan ko'rinyapti. Sababini tushuntirib, nima qilishni ayting.")} />
        </aside>
      </div>

      <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Muammo bo'lsa, app sizni yo'qotmaydi</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Chat umumiy suhbat emas. U sababni ajratadi: yon ta'sir, charchoq, pul, stigma, unutish yoki chalkashuv.
            </p>
          </div>
          <Button className="rounded-full" onClick={() => openHelp("Dori qabulida muammo bor. Mendan sababini so'rab, aniq reja bering.")}>
            <MessageCircle className="size-4" />
            AI yordam
          </Button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {helpReasons.map((reason) => (
            <button
              key={reason.label}
              type="button"
              onClick={() => openHelp(reason.prompt)}
              className="rounded-2xl border border-border/70 bg-background/70 p-4 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <HelpCircle className="mb-3 size-5 text-primary" />
              {reason.label}
            </button>
          ))}
        </div>
      </section>

      <MedicationIntelligencePanel intelligence={medicationIntelligence} />

      <section className="grid gap-3 md:grid-cols-3">
        <ContextTool
          icon={ShieldCheck}
          title="Tasdiqlash kerak bo'lsa"
          text="Photo/Visual DOT oddiy dori cardda emas, faqat doza ishonchli tasdiqlanishi kerak bo'lganda ishlatiladi."
          href="/medications"
        />
        <ContextTool
          icon={Bell}
          title="Telegram eslatma"
          text="Reminder va maxfiy rejim sozlamadan boshqariladi. Bemor uchun asosiy ekran shovqinsiz qoladi."
          href="/settings"
        />
        <ContextTool
          icon={Users}
          title="Care team"
          text="Oila va shifokor bemor muammo bildirsa yoki risk oshsa ulanadi. Doimiy nazorat emas, kerakli paytda yordam."
          href="/settings"
        />
      </section>
    </div>
  )
}

function NextDoseCard({
  dose,
  busyKey,
  onTaken,
  onMissed,
  onHelp,
}: {
  dose: TodayDose
  busyKey: string | null
  onTaken: () => void
  onMissed: () => void
  onHelp: () => void
}) {
  const takenBusy = busyKey === `taken:${dose.medication_id}:${dose.scheduled_time}`
  const missedBusy = busyKey === `missed:${dose.medication_id}:${dose.scheduled_time}`
  const late = dose.status === "missed" || !!dose.is_predictive_alert
  return (
    <div className={cn("mt-6 rounded-[2rem] border p-5 sm:p-6", late ? "border-[var(--risk-high)]/35 bg-[var(--risk-high)]/10" : "border-primary/20 bg-primary/5")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
            <CalendarClock className="size-3.5" />
            {formatDoseTime(dose.scheduled_time)}
          </div>
          <h3 className="mt-4 text-3xl font-bold tracking-tight text-foreground">{dose.name}</h3>
          <p className="mt-1 text-lg text-muted-foreground">{dose.dosage}</p>
          {dose.instructions && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{dose.instructions}</p>}
        </div>
        <StatusBadge status={dose.status} />
      </div>

      {dose.alert_message && (
        <div className="mt-4 flex gap-3 rounded-2xl border border-[var(--risk-high)]/30 bg-background/70 p-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--risk-high)]" />
          <p>{dose.alert_message}</p>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button size="lg" className="h-13 rounded-2xl text-base" onClick={onTaken} disabled={!!busyKey}>
          {takenBusy ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
          Ichdim
        </Button>
        <Button size="lg" variant="outline" className="h-13 rounded-2xl bg-background/70 text-base" onClick={onMissed} disabled={!!busyKey}>
          {missedBusy ? <Loader2 className="size-5 animate-spin" /> : <AlertTriangle className="size-5" />}
          Icholmadim
        </Button>
        <Button size="lg" variant="ghost" className="h-13 rounded-2xl text-base" onClick={onHelp}>
          <MessageCircle className="size-5" />
          Muammo bor
        </Button>
      </div>
    </div>
  )
}

function TodayProgress({ completed, total, missed, progress }: { completed: number; total: number; missed: number; progress: number }) {
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Bugungi progress</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {completed}/{total || 0}
          </p>
        </div>
        <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {progress}%
        </div>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {missed ? `${missed} ta doza muammo sifatida turibdi.` : "Bugungi oqim nazorat ostida."}
      </p>
    </section>
  )
}

function RiskSummary({
  score,
  level,
  needsSupport,
  onHelp,
}: {
  score: number
  level: RiskLevel
  needsSupport: boolean
  onHelp: () => void
}) {
  return (
    <section className={cn("rounded-[2rem] border p-5 shadow-sm", needsSupport ? "border-[var(--risk-high)]/35 bg-[var(--risk-high)]/10" : "border-border/70 bg-card")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Risk signali</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{riskLabel(level)}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-foreground">{score}</p>
          <p className="text-xs text-muted-foreground">/100</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {needsSupport
          ? "Bu signal ko'paygan nazorat emas, vaqtida yordam berish uchun. AI sababni aniqlab beradi."
          : "Risk past bo'lsa ham, app keyingi dozani oddiy oqimda kuzatadi."}
      </p>
      {needsSupport && (
        <Button className="mt-4 w-full rounded-2xl" onClick={onHelp}>
          <Sparkles className="size-4" />
          Sababini aniqlash
        </Button>
      )}
    </section>
  )
}

function EmptyDosePlan() {
  return (
    <div className="mt-6 rounded-[2rem] border border-dashed border-border p-8 text-center">
      <Pill className="mx-auto size-10 text-primary" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">Davolanish rejasi hali yo'q</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Bemor uchun birinchi foydali qadam - dorilarni aniq jadvalga kiritish. Keyin reminder, AI va risk tizimi ishlaydi.
      </p>
      <Button asChild className="mt-5 rounded-2xl">
        <Link href="/medications/add">
          <Plus className="size-4" />
          Birinchi dorini qo'shish
        </Link>
      </Button>
    </div>
  )
}

function AllDoneCard() {
  return (
    <div className="mt-6 rounded-[2rem] border border-primary/25 bg-primary/5 p-8 text-center">
      <CheckCircle2 className="mx-auto size-12 text-primary" />
      <h3 className="mt-4 text-xl font-semibold text-foreground">Bugungi dozalar yopildi</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Endi app sizni bezovta qilmaydi. Ertangi keyingi doza vaqtida yana oddiy eslatma chiqadi.
      </p>
    </div>
  )
}


function MedicationIntelligencePanel({ intelligence }: { intelligence: MedicationIntelligence | null }) {
  if (!intelligence) return null
  const flags = intelligence.potential_interactions.slice(0, 3)
  const timing = intelligence.timing_suggestions.slice(0, 2)
  const insights = intelligence.adherence_insights.slice(0, 2)
  const patterns = (intelligence.adherence_patterns ?? []).filter((pattern) => pattern.problem_level !== "low").slice(0, 2)
  const scheduleAdvisor = intelligence.schedule_advisor
  const scheduleBlocks = (scheduleAdvisor?.time_blocks ?? []).filter((block) => block.level !== "ok").slice(0, 2)
  const timingGapRules = (scheduleAdvisor?.timing_gap_rules ?? []).slice(0, 2)
  const contextFlags = (intelligence.contraindication_flags ?? []).slice(0, 2)
  const normalized = intelligence.normalized_medications.filter((item) => item.rxnorm_name).slice(0, 4)
  const storedSignals = (intelligence.stored_safety_signals ?? []).slice(0, 3)
  const hasContent = flags.length || timing.length || insights.length || patterns.length || scheduleBlocks.length || timingGapRules.length || contextFlags.length
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            Dori tahlili
          </div>
          <h2 className="mt-3 text-lg font-semibold text-foreground">AI jadval va safety review</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {intelligence.patient_message}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/40 px-4 py-3 text-right">
          <p className="text-2xl font-bold text-foreground">{intelligence.schedule_complexity.daily_doses}</p>
          <p className="text-xs text-muted-foreground">kunlik doza</p>
        </div>
      </div>

      {storedSignals.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[var(--risk-high)]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Doctor dashboardga safety signal yuborildi</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Bu signal dori jadvali, bemor klinik profili yoki ichish patterni bo'yicha follow-up kerakligini bildiradi.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {storedSignals.map((signal) => (
                  <Badge key={signal.id ?? signal.rule_code} variant={signal.severity === "urgent" || signal.severity === "critical" ? "destructive" : "outline"} className="rounded-full">
                    {signal.title}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasContent ? (
        <>
          {patterns.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {patterns.map((pattern) => (
                <MedicationPatternCard key={pattern.medication_id} pattern={pattern} />
              ))}
            </div>
          )}
          {scheduleBlocks.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {scheduleBlocks.map((block) => (
                <ScheduleBlockCard key={block.time} block={block} />
              ))}
            </div>
          )}
          {timingGapRules.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {timingGapRules.map((rule) => (
                <TimingGapRuleCard key={`${rule.medications.join("-")}-${rule.suggested_gap_minutes}`} rule={rule} />
              ))}
            </div>
          )}
          {contextFlags.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {contextFlags.map((flag) => (
                <ContextSafetyCard key={`${flag.medication_id}-${flag.issue}`} flag={flag} />
              ))}
            </div>
          )}
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <ReviewColumn title="Interaction review" items={flags.map((flag) => `${flag.medications.join(" + ")}: ${flag.issue}`)} tone="risk" />
            <ReviewColumn title="Vaqt oralig'i" items={timing} tone="time" />
            <ReviewColumn title="Adherence signali" items={insights} tone="info" />
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
          Hozircha jiddiy signal yo'q. Shunga qaramay, noaniq dori yoki yangi dori qo'shilsa shifokor/farmatsevt bilan tasdiqlang.
        </div>
      )}

      {intelligence.questions_for_doctor.length > 0 && (
        <details className="mt-4 group">
          <summary className="cursor-pointer rounded-2xl bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground">
            Shifokorga beriladigan savollar
          </summary>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {intelligence.questions_for_doctor.slice(0, 4).map((question) => (
              <li key={question} className="rounded-xl bg-background/70 px-3 py-2">
                {question}
              </li>
            ))}
          </ul>
        </details>
      )}

      {normalized.length > 0 && (
        <details className="mt-4 group">
          <summary className="cursor-pointer rounded-2xl bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground">
            RxNorm faol modda reconciliation
          </summary>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {normalized.map((item) => (
              <li key={`${item.id}-${item.name}`} className="rounded-xl bg-background/70 px-3 py-2">
                <span className="font-medium text-foreground">{item.name}</span>
                {" -> "}
                {item.rxnorm_name}
                {item.ingredients.length > 0 ? ` (${item.ingredients.map((ingredient) => ingredient.name).filter(Boolean).join(", ")})` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{intelligence.disclaimer}</p>
    </section>
  )
}

function ContextSafetyCard({
  flag,
}: {
  flag: MedicationIntelligence["contraindication_flags"][number]
}) {
  const tone = flag.severity === "caution" ? "border-[var(--risk-high)]/35 bg-[var(--risk-high)]/10" : "border-amber-300/50 bg-amber-50/70"
  return (
    <div className={cn("rounded-2xl border p-4", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{flag.medication_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{flag.related_medications.join(", ")}</p>
        </div>
        <Badge variant={flag.severity === "caution" ? "destructive" : "outline"} className="rounded-full">
          context
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{flag.issue}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{flag.patient_action}</p>
    </div>
  )
}

function TimingGapRuleCard({
  rule,
}: {
  rule: NonNullable<NonNullable<MedicationIntelligence["schedule_advisor"]>["timing_gap_rules"]>[number]
}) {
  const tone = rule.severity === "caution" ? "border-[var(--risk-high)]/35 bg-[var(--risk-high)]/10" : "border-amber-300/50 bg-amber-50/70"
  return (
    <div className={cn("rounded-2xl border p-4", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Interval risk</p>
          <p className="mt-1 text-xs text-muted-foreground">{rule.medications.join(" + ")}</p>
        </div>
        <Badge variant={rule.severity === "caution" ? "destructive" : "outline"} className="rounded-full">
          {rule.suggested_gap_minutes} min
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{rule.issue}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{rule.patient_action}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Savol: {rule.doctor_question}</p>
    </div>
  )
}

function ScheduleBlockCard({
  block,
}: {
  block: NonNullable<MedicationIntelligence["schedule_advisor"]>["time_blocks"][number]
}) {
  const tone = block.level === "caution" ? "border-[var(--risk-high)]/35 bg-[var(--risk-high)]/10" : "border-primary/25 bg-primary/5"
  return (
    <div className={cn("rounded-2xl border p-4", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{block.time} bloki</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {block.medications.map((medication) => `${medication.name} ${medication.dosage}`).join(", ")}
          </p>
        </div>
        <Badge variant={block.level === "caution" ? "destructive" : "outline"} className="rounded-full">
          {block.level === "caution" ? "interval" : "review"}
        </Badge>
      </div>
      {block.issues.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {block.issues.slice(0, 2).map((issue) => (
            <li key={issue} className="leading-relaxed">
              {issue}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{block.patient_action}</p>
    </div>
  )
}

function MedicationPatternCard({
  pattern,
}: {
  pattern: NonNullable<MedicationIntelligence["adherence_patterns"]>[number]
}) {
  const tone =
    pattern.problem_level === "high"
      ? "border-[var(--risk-high)]/35 bg-[var(--risk-high)]/10"
      : "border-primary/25 bg-primary/5"
  const rate = pattern.adherence_rate === null ? "data yo'q" : `${Math.round(pattern.adherence_rate)}%`
  return (
    <div className={cn("rounded-2xl border p-4", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{pattern.medication_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{pattern.dosage}</p>
        </div>
        <Badge variant={pattern.problem_level === "high" ? "destructive" : "outline"} className="rounded-full">
          {rate}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-background/70 px-2 py-2">
          <p className="font-semibold text-foreground">{pattern.missed}</p>
          <p className="text-muted-foreground">missed</p>
        </div>
        <div className="rounded-xl bg-background/70 px-2 py-2">
          <p className="font-semibold text-foreground">{pattern.late}</p>
          <p className="text-muted-foreground">late</p>
        </div>
        <div className="rounded-xl bg-background/70 px-2 py-2">
          <p className="font-semibold text-foreground">{pattern.taken}</p>
          <p className="text-muted-foreground">taken</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pattern.action_hint}</p>
    </div>
  )
}

function ReviewColumn({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: "risk" | "time" | "info"
}) {
  const color =
    tone === "risk"
      ? "border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10"
      : tone === "time"
        ? "border-primary/20 bg-primary/5"
        : "border-border/60 bg-background/70"
  return (
    <div className={cn("rounded-2xl border p-4", color)}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Signal yo'q.</p>
      )}
    </div>
  )
}

function ContextTool({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
  href: string
}) {
  return (
    <Link href={href} className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/5">
      <Icon className="size-5 text-primary" />
      <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </Link>
  )
}

function StatusBadge({ status }: { status: TodayDose["status"] }) {
  const map: Record<string, { label: string; className: string }> = {
    taken: { label: "Ichilgan", className: "bg-primary/10 text-primary" },
    late: { label: "Kech ichilgan", className: "bg-primary/10 text-primary" },
    upcoming: { label: "Kutilmoqda", className: "bg-secondary text-secondary-foreground" },
    missed: { label: "Muammo", className: "bg-[var(--risk-high)]/15 text-[var(--risk-high)]" },
    skipped: { label: "O'tkazildi", className: "bg-muted text-muted-foreground" },
  }
  const item = map[status] ?? map.upcoming
  return <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", item.className)}>{item.label}</span>
}

function sortDoses(doses: TodayDose[]) {
  return [...doses].sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
}

function formatDoseTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(11, 16)
  return date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function riskLabel(level: RiskLevel) {
  if (level === "critical") return "Kritik"
  if (level === "high") return "Yuqori"
  if (level === "medium") return "O'rta"
  return "Past"
}
