"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useT } from "@/lib/i18n/provider"
import { api, type ApiMedication, type PillBottleAuditResult } from "@/lib/api"
import { fileToBase64 } from "@/lib/image-file"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Pill, Plus, Pencil, Trash2, Clock, Camera, Loader2, ScanSearch } from "lucide-react"
import { cn } from "@/lib/utils"

export function MedicationsList() {
  const { t } = useT()
  const [meds, setMeds] = useState<ApiMedication[]>([])
  const [archived, setArchived] = useState<ApiMedication[]>([])
  const [toDelete, setToDelete] = useState<ApiMedication | null>(null)
  const [audits, setAudits] = useState<Record<number, PillBottleAuditResult>>({})
  const [auditingId, setAuditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.medications()
        if (!cancelled) setMeds(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Dorilar yuklanmadi")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = async () => {
    if (!toDelete) return
    const med = toDelete
    setToDelete(null)
    try {
      await api.deleteMedication(med.id)
      setMeds((prev) => prev.filter((m) => m.id !== med.id))
      setArchived((prev) => [{ ...med, is_active: false }, ...prev])
      toast.success(t("common.delete"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik")
    }
  }

  const active = meds.filter((m) => m.is_active)

  async function handleAudit(med: ApiMedication, file: File) {
    const rawCount = window.prompt("Boshlang'ich tablet soni nechta edi?", "30")
    if (rawCount === null) return
    const startingCount = Number.parseInt(rawCount, 10)
    if (!Number.isFinite(startingCount) || startingCount < 1) {
      toast.error("Boshlang'ich son noto'g'ri")
      return
    }
    setAuditingId(med.id)
    try {
      const imageBase64 = await fileToBase64(file)
      const result = await api.auditPillBottle(med.id, {
        image_base64: imageBase64,
        mime_type: file.type || "image/jpeg",
        starting_count: startingCount,
      })
      setAudits((prev) => ({ ...prev, [med.id]: result }))
      toast.success(result.patient_message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pill bottle audit ishlamadi")
    } finally {
      setAuditingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-balance text-2xl font-semibold md:text-3xl">{t("meds.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active.length} {t("meds.active")}
          </p>
        </div>
        <Button asChild size="lg" className="rounded-xl">
          <Link href="/medications/add">
            <Plus className="size-5" />
            <span className="hidden sm:inline">{t("meds.addNew")}</span>
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="rounded-2xl border-border/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">{t("common.loading")}</CardContent>
        </Card>
      ) : active.length === 0 ? (
        <Card className="rounded-2xl border-border/60">
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Pill className="size-6" />
                </EmptyMedia>
                <EmptyTitle>{t("meds.empty")}</EmptyTitle>
                <EmptyDescription>{t("meds.emptyDesc")}</EmptyDescription>
              </EmptyHeader>
              <Button asChild className="mt-4 rounded-xl">
                <Link href="/medications/add">
                  <Plus className="size-4" />
                  {t("meds.addFirst")}
                </Link>
              </Button>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((med) => (
            <MedCard
              key={med.id}
              med={med}
              audit={audits[med.id]}
              auditing={auditingId === med.id}
              onAudit={handleAudit}
              onDelete={() => setToDelete(med)}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">{t("meds.archived")}</h2>
          <div className="grid gap-3 opacity-60 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((med) => (
              <MedCard key={med.id} med={med} archived />
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("meds.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("meds.deleteDesc")} <span className="font-medium text-foreground">{toDelete?.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MedCard({
  med,
  audit,
  auditing,
  onAudit,
  onDelete,
  archived,
}: {
  med: ApiMedication
  audit?: PillBottleAuditResult
  auditing?: boolean
  onAudit?: (med: ApiMedication, file: File) => void
  onDelete?: () => void
  archived?: boolean
}) {
  const { t } = useT()
  return (
    <Card className={cn("rounded-2xl border-border/60 transition-shadow hover:shadow-sm", archived && "bg-muted/30")}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Pill className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight">{med.name}</h3>
              <p className="truncate text-sm text-muted-foreground">{med.dosage}</p>
            </div>
          </div>
          {!archived && (
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="size-8 rounded-lg" aria-label={t("common.edit")}>
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg text-destructive hover:text-destructive"
                onClick={onDelete}
                aria-label={t("common.delete")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {med.times.map((time) => (
              <Badge key={time} variant="secondary" className="rounded-md bg-secondary/60 font-mono text-xs hover:bg-secondary/60">
                {time}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="rounded-md border-border/60">
            {med.frequency}
          </Badge>
          {med.disease && (
            <Badge variant="outline" className="rounded-md border-border/60">
              {med.disease}
            </Badge>
          )}
        </div>

        {med.instructions && <p className="line-clamp-2 text-xs text-muted-foreground">{med.instructions}</p>}

        {!archived && onAudit && (
          <label className={cn(
            "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted",
            auditing && "pointer-events-none opacity-60",
          )}>
            {auditing ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            Smart bottle audit
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (file) onAudit(med, file)
              }}
            />
          </label>
        )}

        {audit && <PillAuditResult audit={audit} />}
      </CardContent>
    </Card>
  )
}

function PillAuditResult({ audit }: { audit: PillBottleAuditResult }) {
  const badge = auditBadge(audit.signal)
  return (
    <div className={cn(
      "rounded-2xl border p-3 text-xs",
      audit.risk_flag ? "border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10" : "border-primary/20 bg-primary/5",
    )}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={badge.variant} className="rounded-full">
          <ScanSearch className="size-3" />
          {badge.label}
        </Badge>
        <span className="text-muted-foreground">{audit.count_confidence}% confidence</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <AuditMetric label="Ko'rindi" value={audit.visible_count ?? "?"} />
        <AuditMetric label="Kutilgan" value={audit.expected_remaining} />
        <AuditMetric label="Farq" value={audit.difference ?? "?"} />
      </div>
      <p className="mt-3 leading-relaxed text-foreground">{audit.patient_message}</p>
      {audit.observations.length > 0 && (
        <p className="mt-1 leading-relaxed text-muted-foreground">{audit.observations.slice(0, 2).join(" · ")}</p>
      )}
    </div>
  )
}

function AuditMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-background/70 px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function auditBadge(signal: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (signal === "possible_missed") return { label: "Missed ehtimoli", variant: "destructive" }
  if (signal === "possible_extra_taken") return { label: "Doza chalkashuvi", variant: "destructive" }
  if (signal === "on_track") return { label: "Jadvalga mos", variant: "default" }
  return { label: "Qayta rasm kerak", variant: "secondary" }
}
