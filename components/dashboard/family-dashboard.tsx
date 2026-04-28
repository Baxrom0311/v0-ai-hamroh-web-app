"use client"

import { useT } from "@/lib/i18n/provider"
import { mockFamilyMembers } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RiskIndicator } from "@/components/shared/risk-indicator"
import { Sparkline } from "@/components/shared/sparkline"
import { Heart, Phone, MessageSquare, AlertTriangle, CheckCircle2, Pill, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function FamilyDashboard() {
  const { t } = useT()
  const members = mockFamilyMembers

  const alerts = members.filter((m) => m.risk === "high" || m.risk === "critical")
  const totalAdherence = Math.round(members.reduce((s, m) => s + m.adherenceRate, 0) / members.length)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-balance">{t("family.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("family.subtitle")}</p>
      </div>

      {alerts.length > 0 && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="size-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">{t("family.alertTitle")}</h3>
              <p className="text-sm text-foreground/80 mt-1">
                {alerts.length === 1
                  ? `${alerts[0].name} ${t("family.alertOne")}`
                  : `${alerts.length} ${t("family.alertMany")}`}
              </p>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl border-destructive/30 bg-transparent">
              {t("family.viewAlerts")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Heart className="size-5" />}
          label={t("family.connected")}
          value={String(members.length)}
        />
        <SummaryCard
          icon={<TrendingUp className="size-5" />}
          label={t("family.avgAdherence")}
          value={`${totalAdherence}%`}
        />
        <SummaryCard
          icon={<CheckCircle2 className="size-5" />}
          label={t("family.healthy")}
          value={String(members.filter((m) => m.risk === "low").length)}
        />
        <SummaryCard
          icon={<AlertTriangle className="size-5" />}
          label={t("family.needAttention")}
          value={String(alerts.length)}
          tone="danger"
        />
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">{t("family.members")}</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y divide-border/60">
            {members.map((m) => (
              <li key={m.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="size-12 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{m.name}</h3>
                    <Badge variant="secondary" className="rounded-md text-xs bg-secondary/60">
                      {m.relation}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Pill className="size-3.5" />
                      {m.medsCount} {t("family.meds")}
                    </span>
                    <span>
                      {t("family.streak")}: <span className="font-medium text-foreground">{m.streak}d</span>
                    </span>
                    <span>{m.lastSeen}</span>
                  </div>
                </div>

                <div className="hidden md:block">
                  <Sparkline data={m.trend} className="text-primary" width={80} height={28} />
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-semibold tabular-nums">{m.adherenceRate}%</p>
                    <RiskIndicator level={m.risk} className="mt-0.5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" className="size-9 rounded-lg" aria-label={t("family.call")}>
                      <Phone className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-9 rounded-lg" aria-label={t("family.message")}>
                      <MessageSquare className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
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
