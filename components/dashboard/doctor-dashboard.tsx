"use client"

import { useEffect, useMemo, useState } from "react"
import { useT } from "@/lib/i18n/provider"
import { api, type DoctorPatientRow } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
}

export function DoctorDashboard() {
  const { t } = useT()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [rows, setRows] = useState<DoctorPatientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.doctorPatients()
        if (!cancelled) setRows(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Doctor dashboard yuklanmadi")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
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
              patients.map((p) => <PatientRow key={p.id} patient={p} />)
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
    diagnoses: ["AI Hamroh"],
    adherenceRate,
    risk: row.latest_risk_level,
    riskScore: row.latest_risk_score,
    trend: [Math.max(adherenceRate - 10, 0), Math.max(adherenceRate - 4, 0), adherenceRate],
    lastVisit: row.last_seen ? new Date(row.last_seen).toLocaleString() : "—",
  }
}

function PatientRow({ patient }: { patient: PatientView }) {
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
            <span className="text-xs text-muted-foreground">{patient.lastVisit}</span>
          </div>
        </div>

        <div className="hidden md:block">
          <Sparkline data={patient.trend} width={70} height={26} />
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold leading-none tabular-nums sm:text-xl">{patient.adherenceRate}%</p>
          <RiskIndicator level={patient.risk} size="sm" className="mt-1.5" />
        </div>

        <ChevronRight className="hidden size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
      </div>
    </li>
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
