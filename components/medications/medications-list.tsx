"use client"

import { useState } from "react"
import Link from "next/link"
import { useT } from "@/lib/i18n/provider"
import { mockMedications } from "@/lib/mock-data"
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
import type { Medication } from "@/lib/types"
import { cn } from "@/lib/utils"

export function MedicationsList() {
  const { t } = useT()
  const [meds, setMeds] = useState<Medication[]>(mockMedications)
  const [toDelete, setToDelete] = useState<Medication | null>(null)

  const active = meds.filter((m) => m.is_active)
  const archived = meds.filter((m) => !m.is_active)

  const handleDelete = () => {
    if (!toDelete) return
    setMeds((prev) => prev.map((m) => (m.id === toDelete.id ? { ...m, is_active: false } : m)))
    setToDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-balance">{t("meds.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
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

      {active.length === 0 ? (
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
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
  med: Medication
  onDelete?: () => void
  archived?: boolean
}) {
  const { t } = useT()
  return (
    <Card className={cn("rounded-2xl border-border/60 transition-shadow hover:shadow-sm", archived && "bg-muted/30")}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Pill className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold leading-tight truncate">{med.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{med.dosage}</p>
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
            {med.schedule_times.map((time) => (
              <Badge
                key={time}
                variant="secondary"
                className="rounded-md font-mono text-xs bg-secondary/60 hover:bg-secondary/60"
              >
                {time}
              </Badge>
            ))}
          </div>
        </div>

        {med.notes && <p className="text-xs text-muted-foreground line-clamp-2">{med.notes}</p>}
      </CardContent>
    </Card>
  )
}
