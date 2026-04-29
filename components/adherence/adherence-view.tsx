"use client"

import { useEffect, useMemo, useState } from "react"
import { useT } from "@/lib/i18n/provider"
import { api, type AdherenceLog, type AdherenceStats, type ApiMedication } from "@/lib/api"
import { Heatmap } from "@/components/shared/heatmap"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, CheckCircle2, XCircle, Calendar, Pill } from "lucide-react"
import { cn } from "@/lib/utils"

type Period = "week" | "month" | "all"
type HeatmapDay = { date: string; total: number; taken: number; missed: number }

export function AdherenceView() {
  const { t } = useT()
  const [period, setPeriod] = useState<Period>("month")
  const [stats, setStats] = useState<AdherenceStats | null>(null)
  const [logs, setLogs] = useState<AdherenceLog[]>([])
  const [meds, setMeds] = useState<ApiMedication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const days = period === "week" ? 7 : period === "month" ? 30 : 90

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [statsData, logsData, medsData] = await Promise.all([
          api.adherenceStats(),
          api.adherenceHistory(days),
          api.medications(),
        ])
        if (cancelled) return
        setStats(statsData)
        setLogs(logsData)
        setMeds(medsData)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Adherence yuklanmadi")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [days])

  const periodStats = useMemo(() => summarizeLogs(logs), [logs])
  const heatmapData = useMemo(() => buildHeatmap(logs, days), [logs, days])
  const recentDoses = logs.slice(0, 8)

  const adherenceRate = period === "week"
    ? Math.round(stats?.adherence_rate_7d ?? periodStats.adherence)
    : period === "month"
      ? Math.round(stats?.adherence_rate_30d ?? periodStats.adherence)
      : periodStats.adherence
  const total = period === "month" ? stats?.total_doses ?? periodStats.total : periodStats.total
  const taken = period === "month" ? (stats?.taken ?? 0) + (stats?.late ?? 0) : periodStats.taken
  const missed = period === "month" ? stats?.missed ?? periodStats.missed : periodStats.missed

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-balance text-2xl font-semibold md:text-3xl">{t("adherence.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("adherence.subtitle")}</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="h-10 rounded-xl bg-muted/60">
            <TabsTrigger value="week" className="rounded-lg">{t("adherence.week")}</TabsTrigger>
            <TabsTrigger value="month" className="rounded-lg">{t("adherence.month")}</TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg">{t("adherence.all")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<TrendingUp className="size-5" />} label={t("adherence.adherenceRate")} value={`${adherenceRate}%`} tone="primary" />
        <StatCard icon={<CheckCircle2 className="size-5" />} label={t("adherence.taken")} value={String(taken)} sub={`/ ${total ?? 0}`} tone="success" />
        <StatCard icon={<XCircle className="size-5" />} label={t("adherence.missed")} value={String(missed)} tone="danger" />
        <StatCard icon={<Calendar className="size-5" />} label={t("adherence.perfectDays")} value={String(heatmapData.filter((d) => d.total > 0 && d.taken === d.total).length)} sub={`/ ${days}`} tone="accent" />
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">{t("adherence.heatmapTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("adherence.heatmapDesc")}</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
          ) : (
            <Heatmap data={heatmapData} weeks={period === "week" ? 1 : period === "month" ? 5 : 13} />
          )}
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>{t("adherence.less")}</span>
            <div className="flex gap-1">
              <div className="size-3 rounded-sm bg-muted" />
              <div className="size-3 rounded-sm bg-primary/25" />
              <div className="size-3 rounded-sm bg-primary/50" />
              <div className="size-3 rounded-sm bg-primary/75" />
              <div className="size-3 rounded-sm bg-primary" />
            </div>
            <span>{t("adherence.more")}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">{t("adherence.recentDoses")}</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y divide-border/60">
            {recentDoses.length === 0 ? (
              <li className="px-6 py-10 text-center text-sm text-muted-foreground">Tarix topilmadi</li>
            ) : (
              recentDoses.map((dose) => {
                const med = meds.find((m) => m.id === dose.medication_id)
                const date = new Date(dose.scheduled_time)
                const status = dose.status === "late" ? "taken" : dose.status
                const tone = status === "taken" ? "text-primary" : status === "missed" ? "text-destructive" : "text-muted-foreground"
                const Icon = status === "taken" ? CheckCircle2 : XCircle
                return (
                  <li key={dose.id} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
                    <div className={cn("flex size-9 items-center justify-center rounded-xl bg-muted", tone)}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Pill className="size-3.5 shrink-0 text-muted-foreground" />
                        <p className="truncate text-sm font-medium">{med?.name || "—"}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                        <span className="font-mono">{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-md border-border/60 text-xs capitalize",
                        status === "taken" && "border-primary/20 bg-primary/10 text-primary",
                        status === "missed" && "border-destructive/20 bg-destructive/10 text-destructive",
                      )}
                    >
                      {status === "taken" ? t("adherence.status.taken") : t("adherence.status.missed")}
                    </Badge>
                  </li>
                )
              })
            )}
          </ul>
          <div className="px-4 pt-4 sm:px-6">
            <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">
              {t("common.loadMore")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function summarizeLogs(logs: AdherenceLog[]) {
  const total = logs.length
  const taken = logs.filter((log) => log.status === "taken" || log.status === "late").length
  const missed = logs.filter((log) => log.status === "missed" || log.status === "skipped").length
  return { total, taken, missed, adherence: total > 0 ? Math.round((taken / total) * 100) : 0 }
}

function buildHeatmap(logs: AdherenceLog[], days: number): HeatmapDay[] {
  const byDate = new Map<string, HeatmapDay>()
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const key = date.toISOString().slice(0, 10)
    byDate.set(key, { date: key, total: 0, taken: 0, missed: 0 })
  }
  for (const log of logs) {
    const key = new Date(log.scheduled_time).toISOString().slice(0, 10)
    const item = byDate.get(key)
    if (!item) continue
    item.total += 1
    if (log.status === "taken" || log.status === "late") item.taken += 1
    if (log.status === "missed" || log.status === "skipped") item.missed += 1
  }
  return Array.from(byDate.values())
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  tone: "primary" | "success" | "danger" | "accent"
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-primary/10 text-primary",
    danger: "bg-destructive/10 text-destructive",
    accent: "bg-accent/15 text-accent-foreground",
  }
  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="space-y-3 p-5">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", tones[tone])}>{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {value}
            {sub && <span className="ml-1 text-sm font-normal text-muted-foreground">{sub}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
