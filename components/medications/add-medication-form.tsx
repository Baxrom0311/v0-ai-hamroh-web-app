"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useT } from "@/lib/i18n/provider"
import { api, type PrescriptionMedicationSuggestion } from "@/lib/api"
import { fileToBase64 } from "@/lib/image-file"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Plus, X, Clock, Pill, ImagePlus, Wand2 } from "lucide-react"

const COMMON_TIMES = ["08:00", "12:00", "14:00", "18:00", "20:00", "22:00"]

export function AddMedicationForm() {
  const { t } = useT()
  const router = useRouter()
  const [name, setName] = useState("")
  const [dosage, setDosage] = useState("")
  const [times, setTimes] = useState<string[]>(["08:00"])
  const [notes, setNotes] = useState("")
  const [disease, setDisease] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [readingPrescription, setReadingPrescription] = useState(false)
  const [prescriptionSummary, setPrescriptionSummary] = useState<string | null>(null)
  const [prescriptionSuggestions, setPrescriptionSuggestions] = useState<PrescriptionMedicationSuggestion[]>([])
  const [newTime, setNewTime] = useState("")
  const [error, setError] = useState<string | null>(null)

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
    setError(null)
    try {
      await api.createMedication({
        name,
        dosage,
        frequency: `${times.length} mahal / kun`,
        times,
        start_date: new Date().toISOString().slice(0, 10),
        instructions: notes || null,
        disease: disease || null,
      })
      toast.success(t("meds.saved"))
      router.push("/medications")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Dori saqlanmadi"
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrescriptionImage = async (file: File) => {
    setReadingPrescription(true)
    setPrescriptionSummary(null)
    setPrescriptionSuggestions([])
    setError(null)
    try {
      const imageBase64 = await fileToBase64(file)
      const result = await api.readPrescription({
        image_base64: imageBase64,
        mime_type: file.type || "image/jpeg",
      })
      setPrescriptionSummary(result.summary)
      setPrescriptionSuggestions(result.medications)
      toast.success(result.summary)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Retsept o'qilmadi"
      setError(message)
      toast.error(message)
    } finally {
      setReadingPrescription(false)
    }
  }

  const applySuggestion = (suggestion: PrescriptionMedicationSuggestion) => {
    if (suggestion.name) setName(suggestion.name)
    if (suggestion.dosage) setDosage(suggestion.dosage)
    if (suggestion.disease) setDisease(suggestion.disease)
    if (suggestion.instructions) setNotes(suggestion.instructions)
    if (suggestion.times.length > 0) setTimes(suggestion.times)
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

      <Card className="rounded-2xl border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Wand2 className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Retseptni rasm orqali o'qish</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Retsept yoki dori qutisini suratga oling, Gemini Vision maydonlarni to'ldirishga yordam beradi.
                </p>
              </div>
            </div>
            <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium shadow-sm hover:bg-muted">
              {readingPrescription ? <Spinner className="mr-2 size-4" /> : <ImagePlus className="mr-2 size-4" />}
              Rasm yuklash
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  if (file) handlePrescriptionImage(file)
                }}
              />
            </label>
          </div>

          {prescriptionSummary && (
            <div className="rounded-xl border border-border/60 bg-background px-3 py-2 text-sm">
              {prescriptionSummary}
            </div>
          )}

          {prescriptionSuggestions.length > 0 && (
            <div className="space-y-2">
              {prescriptionSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.name}-${index}`}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="w-full rounded-xl border border-border/60 bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{suggestion.name || "Noma'lum dori"}</span>
                    <Badge variant="secondary">{suggestion.confidence}%</Badge>
                    {suggestion.dosage && <Badge variant="outline">{suggestion.dosage}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[suggestion.frequency, suggestion.times.join(", "), suggestion.instructions].filter(Boolean).join(" · ") || "Shu ma'lumotlarni formaga qo'llash"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                <FieldLabel htmlFor="disease">{t("meds.disease")}</FieldLabel>
                <Input
                  id="disease"
                  value={disease}
                  onChange={(e) => setDisease(e.target.value)}
                  placeholder="TB, diabet, gipertoniya"
                  className="h-12 rounded-xl"
                />
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

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

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
