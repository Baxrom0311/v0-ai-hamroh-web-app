"use client"

import { useEffect, useMemo, useState } from "react"
import { useT } from "@/lib/i18n/provider"
import { api, type ClinicalSafetySignal, type DoctorPatientRow, type DoctorSafetySignalRow, type SoapNote } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { RiskIndicator } from "@/components/shared/risk-indicator"
import { Sparkline } from "@/components/shared/sparkline"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, AlertTriangle, TrendingUp, CheckCircle2, ChevronRight, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/types"

type Filter = "all" | "high" | "low"

type PatientView = {
  id: number
  name: string
  age: number | null
  diagnoses: string[]
  adherenceRate: number
  risk: RiskLevel
  riskScore: number
  trend: number[]
  lastVisit: string
  activeSignals: number
  latestSafetySignal?: ClinicalSafetySignal | null
}

export function DoctorDashboard() {
  const { t } = useT()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [rows, setRows] = useState<DoctorPatientRow[]>([])
  const [signalRows, setSignalRows] = useState<DoctorSafetySignalRow[]>([])
  const [soapByPatient, setSoapByPatient] = useState<Record<number, SoapNote>>({})
  const [soapLoadingId, setSoapLoadingId] = useState<number | null>(null)
  const [resolvingSignalId, setResolvingSignalId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDashboard(cancelled?: () => boolean) {
    setLoading(true)
    setError(null)
    try {
      const [patientsData, signalsData] = await Promise.all([
        api.doctorPatients(),
        api.doctorSafetySignals("active", 30).catch(() => []),
      ])
      if (cancelled?.()) return
      setRows(patientsData)
      setSignalRows(signalsData)
    } catch (err) {
      if (!cancelled?.()) setError(err instanceof Error ? err.message : "Doctor dashboard yuklanmadi")
    } finally {
      if (!cancelled?.()) setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    loadDashboard(() => cancelled)
    return () => {
      cancelled = true
    }
  }, [])

  const allPatients = useMemo(() => rows.map(mapPatient), [rows])

  const patients = useMemo(() => {
    let list = allPatients
    if (filter === "high") list = list.filter((p) => p.risk === "high" || p.risk === "critical")
    if (filter === "low") list = list.filter((p) => p.risk === "low")
    if (query) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    return list
  }, [allPatients, query, filter])

  const stats = {
    total: allPatients.length,
    high: allPatients.filter((p) => p.risk === "high" || p.risk === "critical").length,
    avgAdherence: allPatients.length
      ? Math.round(allPatients.reduce((s, p) => s + p.adherenceRate, 0) / allPatients.length)
      : 0,
    active: allPatients.filter((p) => p.adherenceRate >= 80).length,
  }

  async function loadSoap(patientId: number) {
    setSoapLoadingId(patientId)
    setError(null)
    try {
      const note = await api.doctorSoapNote(patientId)
      setSoapByPatient((current) => ({ ...current, [patientId]: note }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "SOAP note yaratilmadi")
    } finally {
      setSoapLoadingId(null)
    }
  }

  async function resolveSignal(signalId: number) {
    setResolvingSignalId(signalId)
    setError(null)
    try {
      await api.resolveDoctorSafetySignal(signalId)
      setSignalRows((current) => current.filter((row) => row.signal.id !== signalId))
      const data = await api.doctorPatients()
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signal yopilmadi")
    } finally {
      setResolvingSignalId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Stethoscope className="size-4" />
            <span>{t("doctor.role")}</span>
          </div>
          <h1 className="mt-1 text-balance text-2xl font-semibold md:text-3xl">{t("doctor.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("doctor.subtitle")}</p>
        </div>
      </div>

      {error && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DocStatCard icon={<Users className="size-5" />} label={t("doctor.totalPatients")} value={String(stats.total)} />
        <DocStatCard icon={<TrendingUp className="size-5" />} label={t("doctor.avgAdherence")} value={`${stats.avgAdherence}%`} />
        <DocStatCard icon={<CheckCircle2 className="size-5" />} label={t("doctor.activePatients")} value={String(stats.active)} />
        <DocStatCard icon={<AlertTriangle className="size-5" />} label={t("doctor.highRisk")} value={String(stats.high)} tone="danger" />
      </div>

      <SafetySignalInbox
        signals={signalRows}
        loading={loading}
        resolvingSignalId={resolvingSignalId}
        onResolve={resolveSignal}
      />

      <Card className="rounded-2xl border-border/60">
        <CardHeader className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <CardTitle className="text-lg">{t("doctor.patients")}</CardTitle>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList className="h-10 rounded-xl bg-muted/60">
                <TabsTrigger value="all" className="rounded-lg">{t("doctor.filterAll")}</TabsTrigger>
                <TabsTrigger value="high" className="rounded-lg">{t("doctor.filterHigh")}</TabsTrigger>
                <TabsTrigger value="low" className="rounded-lg">{t("doctor.filterLow")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <InputGroup className="rounded-xl">
            <InputGroupAddon>
              <Search className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput placeholder={t("doctor.searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y divide-border/60">
            {loading ? (
              <li className="px-6 py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</li>
            ) : patients.length === 0 ? (
              <li className="px-6 py-12 text-center text-sm text-muted-foreground">{t("doctor.noResults")}</li>
            ) : (
              patients.map((p) => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  soap={soapByPatient[p.id]}
                  soapLoading={soapLoadingId === p.id}
                  onSoap={() => loadSoap(p.id)}
                />
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function mapPatient(row: DoctorPatientRow): PatientView {
  const adherenceRate = Math.round(row.adherence_rate_7d ?? 0)
  return {
    id: row.patient.id,
    name: row.patient.full_name,
    age: row.patient.age ?? null,
    diagnoses: ["NoSkipAI"],
    adherenceRate,
    risk: row.latest_risk_level,
    riskScore: row.latest_risk_score,
    trend: [Math.max(adherenceRate - 10, 0), Math.max(adherenceRate - 4, 0), adherenceRate],
    lastVisit: row.last_seen ? new Date(row.last_seen).toLocaleString() : "—",
    activeSignals: row.active_safety_signals ?? 0,
    latestSafetySignal: row.latest_safety_signal ?? null,
  }
}

function SafetySignalInbox({
  signals,
  loading,
  resolvingSignalId,
  onResolve,
}: {
  signals: DoctorSafetySignalRow[]
  loading: boolean
  resolvingSignalId: number | null
  onResolve: (signalId: number) => void
}) {
  const topSignals = signals.slice(0, 6)
  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg">AI safety signal inbox</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Chat, dori tahlili va adherence patternlardan kelgan active signallar.
          </p>
        </div>
        <Badge variant={topSignals.length ? "destructive" : "secondary"} className="rounded-full">
          {topSignals.length} active
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="rounded-2xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>
        ) : topSignals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Active safety signal yo'q.
          </div>
        ) : (
          topSignals.map((row) => (
            <div key={row.signal.id ?? row.signal.rule_code} className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={signalBadgeVariant(row.signal.severity)} className="rounded-full">
                      {row.signal.severity}
                    </Badge>
                    <span className="text-xs font-medium text-primary">{signalSourceLabel(row.signal.source)}</span>
                    <span className="text-xs text-muted-foreground">{new Date(row.signal.updated_at || row.signal.created_at || Date.now()).toLocaleString()}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">{row.patient.full_name}: {row.signal.title}</h3>
                  <SignalContextBadges signal={row.signal} />
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{row.signal.message}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Action:</span> {row.signal.action}
                  </p>
                </div>
                {row.signal.id ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-xl"
                    disabled={resolvingSignalId === row.signal.id}
                    onClick={() => onResolve(row.signal.id as number)}
                  >
                    {resolvingSignalId === row.signal.id ? "..." : "Resolve"}
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function signalBadgeVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  if (severity === "urgent" || severity === "critical" || severity === "caution") return "destructive"
  if (severity === "review") return "default"
  return "secondary"
}

function signalSourceLabel(source: string) {
  return (
    {
      medication_interaction: "Dori interaction",
      timing_gap_rule: "Interval risk",
      clinical_context: "Bemor konteksti",
      schedule_advisor: "Jadval bloki",
      adherence_pattern: "Adherence pattern",
      chat_rescue: "AI rescue",
    }[source] ?? source
  )
}

function SignalContextBadges({ signal }: { signal: ClinicalSafetySignal }) {
  const data = signal.related_data || {}
  const medications = Array.isArray(data.medications) ? data.medications.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []
  const observedGap = typeof data.observed_gap_minutes === "number" ? data.observed_gap_minutes : null
  const suggestedGap = typeof data.suggested_gap_minutes === "number" ? data.suggested_gap_minutes : null

  if (medications.length === 0 && observedGap == null && suggestedGap == null) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {medications.length > 0 && (
        <Badge variant="outline" className="rounded-full bg-background/80 text-[11px]">
          {medications.slice(0, 3).join(" + ")}
        </Badge>
      )}
      {observedGap != null && (
        <Badge variant="outline" className="rounded-full bg-background/80 text-[11px]">
          Hozir: {observedGap} min
        </Badge>
      )}
      {suggestedGap != null && (
        <Badge variant="secondary" className="rounded-full text-[11px]">
          Kerak: {suggestedGap} min
        </Badge>
      )}
    </div>
  )
}

function PatientRow({
  patient,
  soap,
  soapLoading,
  onSoap,
}: {
  patient: PatientView
  soap?: SoapNote
  soapLoading: boolean
  onSoap: () => void
}) {
  const { t } = useT()
  return (
    <li className="group cursor-pointer px-4 py-4 transition-colors hover:bg-muted/40 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/60 font-semibold text-foreground">
          {initials(patient.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{patient.name}</h3>
            {patient.age ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                {patient.age} {t("doctor.years")}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {patient.diagnoses.map((d) => (
              <Badge key={d} variant="outline" className="rounded-md border-border/60 bg-background text-xs">
                {d}
              </Badge>
            ))}
            {patient.activeSignals > 0 && (
              <Badge variant={patient.latestSafetySignal?.severity === "urgent" || patient.latestSafetySignal?.severity === "critical" ? "destructive" : "secondary"} className="rounded-md text-xs">
                {patient.activeSignals} safety signal
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{patient.lastVisit}</span>
          </div>
          {patient.latestSafetySignal && (
            <p className="mt-1 max-w-2xl truncate text-xs text-muted-foreground">
              {patient.latestSafetySignal.title}: {patient.latestSafetySignal.action}
            </p>
          )}
        </div>

        <div className="hidden md:block">
          <Sparkline data={patient.trend} width={70} height={26} />
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold leading-none tabular-nums sm:text-xl">{patient.adherenceRate}%</p>
          <RiskIndicator level={patient.risk} size="sm" className="mt-1.5" />
        </div>

        <Button size="sm" variant="outline" className="hidden rounded-xl sm:inline-flex" disabled={soapLoading} onClick={onSoap}>
          {soapLoading ? "..." : "SOAP"}
        </Button>
        <ChevronRight className="hidden size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
      </div>
      {soap && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={soap.ai_generated ? "default" : "secondary"}>{soap.ai_generated ? "AI SOAP" : "SOAP Note"}</Badge>
            <span className="text-xs text-muted-foreground">{new Date(soap.generated_at).toLocaleString()}</span>
          </div>
          <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
            <SoapBlock title="S" text={soap.subjective} />
            <SoapBlock title="O" text={soap.objective} />
            <SoapBlock title="A" text={soap.assessment} />
            <div className="rounded-xl bg-background/70 p-3">
              <p className="font-semibold text-foreground">P</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {soap.plan.slice(0, 3).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

function SoapBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl bg-background/70 p-3">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}

function DocStatCard({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "primary" | "danger"
}) {
  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="space-y-3 p-5">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
