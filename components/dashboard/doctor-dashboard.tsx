"use client"

import { useState, useMemo } from "react"
import { useT } from "@/lib/i18n/provider"
import { mockPatients } from "@/lib/mock-data"
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

export function DoctorDashboard() {
  const { t } = useT()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const patients = useMemo(() => {
    let list = mockPatients
    if (filter === "high") list = list.filter((p) => p.risk === "high" || p.risk === "critical")
    if (filter === "low") list = list.filter((p) => p.risk === "low")
    if (query) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    return list
  }, [query, filter])

  const stats = {
    total: mockPatients.length,
    high: mockPatients.filter((p) => p.risk === "high" || p.risk === "critical").length,
    avgAdherence: Math.round(mockPatients.reduce((s, p) => s + p.adherenceRate, 0) / mockPatients.length),
    active: mockPatients.filter((p) => p.adherenceRate >= 80).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <Stethoscope className="size-4" />
            <span>{t("doctor.role")}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-balance mt-1">{t("doctor.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("doctor.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <DocStatCard icon={<Users className="size-5" />} label={t("doctor.totalPatients")} value={String(stats.total)} />
        <DocStatCard
          icon={<TrendingUp className="size-5" />}
          label={t("doctor.avgAdherence")}
          value={`${stats.avgAdherence}%`}
        />
        <DocStatCard
          icon={<CheckCircle2 className="size-5" />}
          label={t("doctor.activePatients")}
          value={String(stats.active)}
        />
        <DocStatCard
          icon={<AlertTriangle className="size-5" />}
          label={t("doctor.highRisk")}
          value={String(stats.high)}
          tone="danger"
        />
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">{t("doctor.patients")}</CardTitle>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList className="rounded-xl bg-muted/60 h-10">
                <TabsTrigger value="all" className="rounded-lg">
                  {t("doctor.filterAll")}
                </TabsTrigger>
                <TabsTrigger value="high" className="rounded-lg">
                  {t("doctor.filterHigh")}
                </TabsTrigger>
                <TabsTrigger value="low" className="rounded-lg">
                  {t("doctor.filterLow")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <InputGroup className="rounded-xl">
            <InputGroupAddon>
              <Search className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={t("doctor.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y divide-border/60">
            {patients.length === 0 ? (
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

function PatientRow({
  patient,
}: {
  patient: {
    id: string
    name: string
    age: number
    diagnoses: string[]
    adherenceRate: number
    risk: RiskLevel
    streak: number
    trend: number[]
    lastVisit: string
  }
}) {
  const { t } = useT()
  return (
    <li className="px-4 sm:px-6 py-4 hover:bg-muted/40 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="size-11 rounded-xl bg-secondary/60 text-foreground flex items-center justify-center font-semibold shrink-0">
          {patient.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{patient.name}</h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {patient.age} {t("doctor.years")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {patient.diagnoses.slice(0, 2).map((d) => (
              <Badge key={d} variant="outline" className="rounded-md text-xs border-border/60 bg-background">
                {d}
              </Badge>
            ))}
            {patient.diagnoses.length > 2 && (
              <span className="text-xs text-muted-foreground">+{patient.diagnoses.length - 2}</span>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <Sparkline data={patient.trend} className="text-primary" width={70} height={26} />
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-semibold tabular-nums leading-none sm:text-xl">{patient.adherenceRate}%</p>
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
      <CardContent className="p-5 space-y-3">
        <div
          className={cn(
            "size-10 rounded-xl flex items-center justify-center",
            tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

