"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useT } from "@/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Plus, X, Clock, Pill } from "lucide-react"

const COMMON_TIMES = ["08:00", "12:00", "14:00", "18:00", "20:00", "22:00"]

export function AddMedicationForm() {
  const { t } = useT()
  const router = useRouter()
  const [name, setName] = useState("")
  const [dosage, setDosage] = useState("")
  const [times, setTimes] = useState<string[]>(["08:00"])
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [newTime, setNewTime] = useState("")

  const addTime = (time: string) => {
    if (!time || times.includes(time)) return
    setTimes((prev) => [...prev, time].sort())
    setNewTime("")
  }

  const removeTime = (time: string) => {
    setTimes((prev) => prev.filter((t) => t !== time))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !dosage || times.length === 0) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    router.push("/medications")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-xl">
          <Link href="/medications" aria-label={t("common.back")}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">{t("meds.addTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("meds.addSubtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="size-5 text-primary" />
              {t("meds.details")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="med-name">{t("meds.name")}</FieldLabel>
                <Input
                  id="med-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("meds.namePlaceholder")}
                  className="h-12 rounded-xl"
                  required
                />
                <FieldDescription>{t("meds.nameHint")}</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="dosage">{t("meds.dosage")}</FieldLabel>
                <Input
                  id="dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder={t("meds.dosagePlaceholder")}
                  className="h-12 rounded-xl"
                  required
                />
                <FieldDescription>{t("meds.dosageHint")}</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>{t("meds.scheduleTimes")}</FieldLabel>
                <FieldDescription>{t("meds.scheduleHint")}</FieldDescription>

                <div className="flex flex-wrap gap-2 mt-1">
                  {times.map((time) => (
                    <Badge
                      key={time}
                      variant="secondary"
                      className="h-9 px-3 rounded-lg font-mono text-sm bg-primary/10 text-primary hover:bg-primary/15 gap-1.5"
                    >
                      <Clock className="size-3.5" />
                      {time}
                      <button
                        type="button"
                        onClick={() => removeTime(time)}
                        className="ml-1 hover:bg-primary/20 rounded -mr-1 p-0.5"
                        aria-label={`${t("common.remove")} ${time}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {COMMON_TIMES.filter((t) => !times.includes(t)).map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => addTime(time)}
                      className="h-9 px-3 rounded-lg border border-dashed border-border text-sm font-mono text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      + {time}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="h-11 rounded-xl flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTime(newTime)}
                    disabled={!newTime}
                    className="h-11 rounded-xl"
                  >
                    <Plus className="size-4" />
                    {t("common.add")}
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="notes">{t("meds.notes")}</FieldLabel>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("meds.notesPlaceholder")}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-6">
          <Button asChild variant="outline" size="lg" className="rounded-xl bg-transparent">
            <Link href="/medications">{t("common.cancel")}</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={submitting || !name || !dosage || times.length === 0}
            className="rounded-xl"
          >
            {submitting && <Spinner className="size-4" />}
            {submitting ? t("common.saving") : t("meds.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
