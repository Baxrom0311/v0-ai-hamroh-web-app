"use client"

import { useEffect, useMemo, useState } from "react"
import { useT } from "@/lib/i18n/provider"
import { api, type FamilyConnection, type FamilyObservationSummary, type FamilyPatientStatus, type RiskLevel } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RiskIndicator } from "@/components/shared/risk-indicator"
import { Sparkline } from "@/components/shared/sparkline"
import { Heart, Phone, MessageSquare, AlertTriangle, CheckCircle2, Pill, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

type FamilyMemberView = {
  id: number
  name: string
  relation: string
  phone: string
  medsCount: number
  adherenceRate: number
  risk: RiskLevel
  trend: number[]
  lastSeen: string
  alerts: string[]
  observation: FamilyObservationSummary | null
}

export function FamilyDashboard() {
  const { t } = useT()
  const [members, setMembers] = useState<FamilyMemberView[]>([])
  const [loading, setLoading] = useState(true)
  const [savingObservation, setSavingObservation] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const connections = await api.familyList()
        const approved = connections.filter((connection) => connection.is_approved && connection.patient)
        const rows = await Promise.all(
          approved.map(async (connection) => {
            const patientId = connection.patient?.id
            const [status, observation] = await Promise.all([
              api.familyPatientStatus(patientId).catch(() => null),
              patientId ? api.familyObservations(patientId).catch(() => null) : Promise.resolve(null),
            ])
            return { connection, status, observation }
          }),
        )
        if (cancelled) return
        setMembers(rows.map((row) => mapFamilyMember(row.connection, row.status, row.observation)))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Family dashboard yuklanmadi")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const alerts = members.filter((m) => m.risk === "high" || m.risk === "critical" || m.alerts.length > 0)
  const totalAdherence = useMemo(
    () => (members.length ? Math.round(members.reduce((s, m) => s + m.adherenceRate, 0) / members.length) : 0),
    [members],
  )

  async function sendObservation(patientId: number, mood: "good" | "tired" | "bad", tookMedication: boolean) {
    setSavingObservation(patientId)
    setError(null)
    try {
      const result = await api.createFamilyObservation({
        patient_id: patientId,
        mood_signal: mood,
        took_medication: tookMedication,
      })
      setMembers((current) =>
        current.map((member) =>
          member.id === patientId
            ? {
                ...member,
                observation: {
                  observations: [result.observation, ...(member.observation?.observations ?? [])],
                  mismatch: result.mismatch,
                },
                alerts: result.mismatch.has_mismatch ? Array.from(new Set([...member.alerts, result.mismatch.message])) : member.alerts,
              }
            : member,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Family signal yuborilmadi")
    } finally {
      setSavingObservation(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-2xl font-semibold md:text-3xl">{t("family.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("family.subtitle")}</p>
      </div>

      {error && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {alerts.length > 0 && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">{t("family.alertTitle")}</h3>
              <p className="mt-1 text-sm text-foreground/80">
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon={<Heart className="size-5" />} label={t("family.connected")} value={String(members.length)} />
        <SummaryCard icon={<TrendingUp className="size-5" />} label={t("family.avgAdherence")} value={`${totalAdherence}%`} />
        <SummaryCard icon={<CheckCircle2 className="size-5" />} label={t("family.healthy")} value={String(members.filter((m) => m.risk === "low").length)} />
        <SummaryCard icon={<AlertTriangle className="size-5" />} label={t("family.needAttention")} value={String(alerts.length)} tone="danger" />
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">{t("family.members")}</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
          ) : members.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              Tasdiqlangan bemor connection topilmadi.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {members.map((m) => (
                <li key={m.id} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
                  <Avatar className="size-12 shrink-0">
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials(m.name)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{m.name}</h3>
                      <Badge variant="secondary" className="rounded-md bg-secondary/60 text-xs">
                        {m.relation}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Pill className="size-3.5" />
                        {m.medsCount} {t("family.meds")}
                      </span>
                      <span>{m.lastSeen}</span>
                    </div>
                    {m.observation?.mismatch.has_mismatch && (
                      <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        Family signal: {m.observation.mismatch.message}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="h-8 rounded-lg" disabled={savingObservation === m.id} onClick={() => sendObservation(m.id, "good", true)}>
                        😊 Yaxshi
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-lg" disabled={savingObservation === m.id} onClick={() => sendObservation(m.id, "tired", false)}>
                        😐 Charchagan
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-lg" disabled={savingObservation === m.id} onClick={() => sendObservation(m.id, "bad", false)}>
                        😟 Yomon
                      </Button>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <Sparkline data={m.trend} width={80} height={28} />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-semibold tabular-nums">{m.adherenceRate}%</p>
                      <RiskIndicator level={m.risk} className="mt-0.5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button asChild size="icon" variant="ghost" className="size-9 rounded-lg" aria-label={t("family.call")}>
                        <a href={`tel:${m.phone}`}>
                          <Phone className="size-4" />
                        </a>
                      </Button>
                      <Button size="icon" variant="ghost" className="size-9 rounded-lg" aria-label={t("family.message")}>
                        <MessageSquare className="size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function mapFamilyMember(
  connection: FamilyConnection,
  status: FamilyPatientStatus | null,
  observation: FamilyObservationSummary | null,
): FamilyMemberView {
  const patient = connection.patient!
  const adherence = Math.round(status?.adherence_rate_7d ?? 0)
  return {
    id: patient.id,
    name: status?.patient_name ?? patient.full_name,
    relation: connection.relationship,
    phone: patient.phone,
    medsCount: status?.today_status.scheduled ?? 0,
    adherenceRate: adherence,
    risk: status?.current_risk_level ?? "low",
    trend: [Math.max(adherence - 12, 0), Math.max(adherence - 6, 0), adherence],
    lastSeen: status?.last_taken_at ? new Date(status.last_taken_at).toLocaleString() : "—",
    alerts: observation?.mismatch.has_mismatch ? [...(status?.alerts ?? []), observation.mismatch.message] : (status?.alerts ?? []),
    observation,
  }
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
