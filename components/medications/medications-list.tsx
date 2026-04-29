"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useT } from "@/lib/i18n/provider"
import { api, type ApiMedication } from "@/lib/api"
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
import { Pill, Plus, Pencil, Trash2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export function MedicationsList() {
  const { t } = useT()
  const [meds, setMeds] = useState<ApiMedication[]>([])
  const [archived, setArchived] = useState<ApiMedication[]>([])
  const [toDelete, setToDelete] = useState<ApiMedication | null>(null)
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
            <MedCard key={med.id} med={med} onDelete={() => setToDelete(med)} />
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
  onDelete,
  archived,
}: {
  med: ApiMedication
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
      </CardContent>
    </Card>
  )
}
