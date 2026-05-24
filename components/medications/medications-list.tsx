"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useT } from "@/lib/i18n/provider"
import { api, type ApiMedication, type DrugKnowledge, type PillBottleAuditResult } from "@/lib/api"
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
import { Camera, Clock, ExternalLink, Loader2, Pencil, Pill, Plus, ScanSearch, ShieldAlert, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function MedicationsList() {
  const { t } = useT()
  const [meds, setMeds] = useState<ApiMedication[]>([])
  const [archived, setArchived] = useState<ApiMedication[]>([])
  const [toDelete, setToDelete] = useState<ApiMedication | null>(null)
  const [audits, setAudits] = useState<Record<number, PillBottleAuditResult>>({})
  const [drugKnowledge, setDrugKnowledge] = useState<Record<number, DrugKnowledge>>({})
  const [auditingId, setAuditingId] = useState<number | null>(null)
  const [knowledgeLoadingId, setKnowledgeLoadingId] = useState<number | null>(null)
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

  async function handleDrugKnowledge(med: ApiMedication) {
    setKnowledgeLoadingId(med.id)
    try {
      const result = await api.medicationDrugKnowledge(med.id)
      setDrugKnowledge((prev) => ({ ...prev, [med.id]: result }))
      setMeds((prev) =>
        prev.map((item) =>
          item.id === med.id
            ? {
                ...item,
                rxcui: result.rxcui,
                rxnorm_name: result.rxnorm_name,
                active_ingredients: result.ingredients,
                drug_source: result.source,
                drug_knowledge_snapshot: result as unknown as Record<string, unknown>,
              }
            : item,
        ),
      )
      toast.success("Official dori tahlili yangilandi")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dori tahlili olinmadi")
    } finally {
      setKnowledgeLoadingId(null)
    }
  }

  const active = meds.filter((m) => m.is_active)

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
              knowledge={drugKnowledge[med.id]}
              auditing={auditingId === med.id}
              knowledgeLoading={knowledgeLoadingId === med.id}
              onAudit={handleAudit}
              onDrugKnowledge={handleDrugKnowledge}
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
  knowledge,
  auditing,
  knowledgeLoading,
  onAudit,
  onDrugKnowledge,
  onDelete,
  archived,
}: {
  med: ApiMedication
  audit?: PillBottleAuditResult
  knowledge?: DrugKnowledge
  auditing?: boolean
  knowledgeLoading?: boolean
  onAudit?: (med: ApiMedication, file: File) => void
  onDrugKnowledge?: (med: ApiMedication) => void
  onDelete?: () => void
  archived?: boolean
}) {
  const { t } = useT()
  const ingredients = (med.active_ingredients ?? []).map((item) => item.name).filter((name): name is string => Boolean(name))

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

        {(med.rxnorm_name || ingredients.length > 0) && (
          <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <ScanSearch className="size-3.5 text-primary" />
              <span className="font-medium text-foreground">
                {ingredients.length > 0 ? `Faol modda: ${ingredients.slice(0, 2).join(", ")}` : med.rxnorm_name}
              </span>
              {med.rxcui && (
                <Badge variant="outline" className="rounded-full text-[10px]">
                  RxNorm {med.rxcui}
                </Badge>
              )}
            </div>
            {med.drug_source && <p className="mt-1 text-muted-foreground">{med.drug_source}</p>}
          </div>
        )}

        {!archived && onDrugKnowledge && (
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => onDrugKnowledge(med)}
            disabled={knowledgeLoading}
          >
            {knowledgeLoading ? <Loader2 className="size-4 animate-spin" /> : <ShieldAlert className="size-4" />}
            Official label tahlil
          </Button>
        )}

        {!archived && onAudit && (
          <label
            className={cn(
              "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted",
              auditing && "pointer-events-none opacity-60",
            )}
          >
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
        {knowledge && <DrugKnowledgeResult knowledge={knowledge} />}
      </CardContent>
    </Card>
  )
}

function DrugKnowledgeResult({ knowledge }: { knowledge: DrugKnowledge }) {
  const ingredients = knowledge.ingredients.map((item) => item.name).filter((name): name is string => Boolean(name))
  const label = knowledge.label_evidence
  const hasLabelSignals = label.found || label.has_boxed_warning || label.has_drug_interactions || label.has_contraindications || label.has_warnings

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={knowledge.rxcui ? "secondary" : "outline"} className="rounded-full">
          {knowledge.rxcui ? `RxNorm ${knowledge.rxcui}` : "RxNorm topilmadi"}
        </Badge>
        {hasLabelSignals && (
          <Badge variant={label.has_boxed_warning ? "destructive" : "outline"} className="rounded-full">
            FDA label
          </Badge>
        )}
      </div>

      <p className="mt-2 leading-relaxed text-foreground">{knowledge.patient_summary}</p>
      {ingredients.length > 0 && (
        <p className="mt-1 leading-relaxed text-muted-foreground">
          Faol modda: <span className="font-medium text-foreground">{ingredients.join(", ")}</span>
        </p>
      )}
      <DoseEstimateBadges knowledge={knowledge} className="mt-2" />

      <div className="mt-3 space-y-2">
        <KnowledgeLine label="Doza formati" value={knowledge.dose_review.message} tone={knowledge.dose_review.needs_review ? "review" : undefined} />
        <KnowledgeLine label="Kunlik doza" value={knowledge.daily_dose_review.message} tone={knowledge.daily_dose_review.level} />
        <KnowledgeLine label="Qabul vaqti" value={knowledge.administration_review.timing_message} />
      </div>

      {label.snippets.length > 0 && (
        <div className="mt-3 rounded-xl border border-border/60 bg-background/70 p-2">
          <p className="font-semibold text-foreground">Official labeldan qisqa dalil</p>
          {label.snippets.slice(0, 2).map((snippet) => (
            <p key={snippet.section} className="mt-1 leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{snippet.section}:</span> {snippet.text}
            </p>
          ))}
        </div>
      )}

      {knowledge.warnings.length > 0 && (
        <div className="mt-3 rounded-xl border border-[var(--risk-high)]/25 bg-[var(--risk-high)]/10 p-2">
          {knowledge.warnings.slice(0, 2).map((warning) => (
            <p key={warning} className="leading-relaxed text-muted-foreground">
              {warning}
            </p>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {knowledge.official_sources.slice(0, 2).map((source) => (
          <a
            key={`${source.name}-${source.url}`}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/40"
          >
            {source.name}
            <ExternalLink className="size-3" />
          </a>
        ))}
      </div>
    </div>
  )
}

function DoseEstimateBadges({ knowledge, className }: { knowledge: DrugKnowledge; className?: string }) {
  const singleDose = knowledge.dose_review.estimated_single_dose_amount_mg
  const dailyDose = knowledge.daily_dose_review.estimated_daily_amount_mg
  if (singleDose == null && dailyDose == null) return null

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {singleDose != null && (
        <Badge variant="outline" className="rounded-full bg-background/70">
          1 qabul: {formatMg(singleDose)}
        </Badge>
      )}
      {knowledge.dose_review.dose_count != null && (
        <Badge variant="outline" className="rounded-full bg-background/70">
          Soni: {Number(knowledge.dose_review.dose_count.toFixed(2)).toLocaleString("uz-UZ")} dona
        </Badge>
      )}
      {dailyDose != null && (
        <Badge variant={knowledge.daily_dose_review.level === "caution" ? "destructive" : "secondary"} className="rounded-full">
          Kuniga: {formatMg(dailyDose)}
        </Badge>
      )}
    </div>
  )
}

function formatMg(value: number) {
  return `${Number(value.toFixed(4)).toLocaleString("uz-UZ")}mg`
}

function KnowledgeLine({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-background/70 p-2",
        tone === "caution" ? "border-[var(--risk-high)]/30" : tone === "review" ? "border-amber-300/50" : "border-border/60",
      )}
    >
      <p className="font-semibold text-foreground">{label}</p>
      <p className="mt-1 leading-relaxed text-muted-foreground">{value}</p>
    </div>
  )
}

function PillAuditResult({ audit }: { audit: PillBottleAuditResult }) {
  const badge = auditBadge(audit.signal)
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 text-xs",
        audit.risk_flag ? "border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10" : "border-primary/20 bg-primary/5",
      )}
    >
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
