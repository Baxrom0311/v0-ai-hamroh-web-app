"use client"

import { useState, useMemo } from "react"
import { useT } from "@/lib/i18n/provider"
import { mockHeatmapData, mockMedications, mockDoses } from "@/lib/mock-data"
import { Heatmap } from "@/components/shared/heatmap"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, CheckCircle2, XCircle, Clock, Calendar, Pill } from "lucide-react"
import { cn } from "@/lib/utils"

type Period = "week" | "month" | "all"

export function AdherenceView() {
  const { t } = useT()
  const [period, setPeriod] = useState<Period>("month")

  const stats = useMemo(() => {
    const days = period === "week" ? 7 : period === "month" ? 30 : mockHeatmapData.length
    const data = mockHeatmapData.slice(-days)
    const total = data.reduce((s, d) => s + d.total, 0)
    const taken = data.reduce((s, d) => s + d.taken, 0)
    const missed = data.reduce((s, d) => s + d.missed, 0)
    const skipped = total - taken - missed
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 0
    const perfect = data.filter((d) => d.total > 0 && d.taken === d.total).length
    return { total, taken, missed, skipped, adherence, perfect, days: data.length }
  }, [period])

  const recentDoses = mockDoses.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-balance">{t("adherence.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("adherence.subtitle")}</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="rounded-xl bg-muted/60 h-10">
            <TabsTrigger value="week" className="rounded-lg">
              {t("adherence.week")}
            </TabsTrigger>
            <TabsTrigger value="month" className="rounded-lg">
              {t("adherence.month")}
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg">
              {t("adherence.all")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label={t("adherence.adherenceRate")}
          value={`${stats.adherence}%`}
          tone="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="size-5" />}
          label={t("adherence.taken")}
          value={String(stats.taken)}
          sub={`/ ${stats.total}`}
          tone="success"
        />
        <StatCard
          icon={<XCircle className="size-5" />}
          label={t("adherence.missed")}
          value={String(stats.missed)}
          tone="danger"
        />
        <StatCard
          icon={<Calendar className="size-5" />}
          label={t("adherence.perfectDays")}
          value={String(stats.perfect)}
          sub={`/ ${stats.days}`}
          tone="accent"
        />
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">{t("adherence.heatmapTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("adherence.heatmapDesc")}</p>
        </CardHeader>
        <CardContent>
          <Heatmap data={mockHeatmapData} weeks={period === "week" ? 1 : period === "month" ? 5 : 13} />
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
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
            {recentDoses.map((dose) => {
              const med = mockMedications.find((m) => m.id === dose.medication_id)
              const date = new Date(dose.scheduled_at)
              const tone =
                dose.status === "taken"
                  ? "text-primary"
                  : dose.status === "missed"
                    ? "text-destructive"
                    : "text-muted-foreground"
              const Icon = dose.status === "taken" ? CheckCircle2 : dose.status === "missed" ? XCircle : Clock
              return (
                <li key={dose.id} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
                  <div className={cn("size-9 rounded-xl bg-muted flex items-center justify-center", tone)}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Pill className="size-3.5 text-muted-foreground shrink-0" />
                      <p className="font-medium text-sm truncate">{med?.name || "—"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                      <span className="font-mono">
                        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md text-xs capitalize border-border/60",
                      dose.status === "taken" && "bg-primary/10 text-primary border-primary/20",
                      dose.status === "missed" && "bg-destructive/10 text-destructive border-destructive/20",
                    )}
                  >
                    {t(`adherence.status.${dose.status}`)}
                  </Badge>
                </li>
              )
            })}
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
      <CardContent className="p-5 space-y-3">
        <div className={cn("size-10 rounded-xl flex items-center justify-center", tones[tone])}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">
            {value}
            {sub && <span className="text-sm text-muted-foreground font-normal ml-1">{sub}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
