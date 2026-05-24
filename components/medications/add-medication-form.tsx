"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useT } from "@/lib/i18n/provider"
import { api, type DrugSearchResult, type MedicationSafetyCheck, type MedicationSafetyCheckPayload, type PrescriptionMedicationSuggestion } from "@/lib/api"
import { fileToBase64 } from "@/lib/image-file"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, ExternalLink, ImagePlus, Pill, Plus, ShieldCheck, Wand2, X } from "lucide-react"

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
  const [safetyChecking, setSafetyChecking] = useState(false)
  const [safetyCheck, setSafetyCheck] = useState<MedicationSafetyCheck | null>(null)
  const [drugSearching, setDrugSearching] = useState(false)
  const [drugSearchResults, setDrugSearchResults] = useState<DrugSearchResult[]>([])
  const [prescriptionSummary, setPrescriptionSummary] = useState<string | null>(null)
  const [prescriptionSuggestions, setPrescriptionSuggestions] = useState<PrescriptionMedicationSuggestion[]>([])
  const [newTime, setNewTime] = useState("")
  const [error, setError] = useState<string | null>(null)

  const addTime = (time: string) => {
    if (!time || times.includes(time)) return
    setTimes((prev) => [...prev, time].sort())
    setSafetyCheck(null)
    setNewTime("")
  }

  const removeTime = (time: string) => {
    setTimes((prev) => prev.filter((t) => t !== time))
    setSafetyCheck(null)
  }

  useEffect(() => {
    const query = name.trim()
    if (query.length < 2) {
      setDrugSearchResults([])
      setDrugSearching(false)
      return
    }

    let cancelled = false
    setDrugSearching(true)
    const timer = window.setTimeout(async () => {
      try {
        const result = await api.drugSearch(query, 5)
        if (!cancelled) setDrugSearchResults(result.results)
      } catch {
        if (!cancelled) setDrugSearchResults([])
      } finally {
        if (!cancelled) setDrugSearching(false)
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [name])

  const buildSafetyPayload = (overrides: Partial<MedicationSafetyCheckPayload> = {}): MedicationSafetyCheckPayload => {
    const nextTimes = overrides.times ?? times

    return {
      name: overrides.name ?? name,
      dosage: overrides.dosage ?? dosage,
      frequency: overrides.frequency ?? `${nextTimes.length} mahal / kun`,
      times: nextTimes,
      instructions: overrides.instructions === undefined ? notes || null : overrides.instructions,
      disease: overrides.disease === undefined ? disease || null : overrides.disease,
    }
  }

  const runSafetyCheck = async (overrides?: Partial<MedicationSafetyCheckPayload>) => {
    const result = await api.medicationSafetyCheck(buildSafetyPayload(overrides))
    setSafetyCheck(result)
    return result
  }

  const handleSafetyCheck = async () => {
    if (!name || !dosage || times.length === 0) return
    setSafetyChecking(true)
    setError(null)
    try {
      const result = await runSafetyCheck()
      if (result.review_required) {
        toast.warning("Dori bo'yicha tekshirish kerak bo'lgan signal bor")
      } else {
        toast.success("Hozircha katta signal ko'rinmadi")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Dori tahlili bajarilmadi"
      setError(message)
      toast.error(message)
    } finally {
      setSafetyChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !dosage || times.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      if (!safetyCheck) {
        await runSafetyCheck()
        toast.warning("Avval rasmiy data + AI tahlilni ko'rib chiqing. Keyin yana Saqlashni bosing.")
        return
      }
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

  const applySuggestion = async (suggestion: PrescriptionMedicationSuggestion) => {
    const suggestionTimes = Array.isArray(suggestion.times) ? suggestion.times.filter(Boolean) : []
    const nextName = suggestion.name ?? name
    const nextDosage = suggestion.dosage ?? dosage
    const nextDisease = suggestion.disease ?? disease
    const nextNotes = suggestion.instructions ?? notes
    const nextTimes = suggestionTimes.length > 0 ? suggestionTimes : times

    setSafetyCheck(null)
    if (suggestion.name) setName(suggestion.name)
    if (suggestion.dosage) setDosage(suggestion.dosage)
    if (suggestion.disease) setDisease(suggestion.disease)
    if (suggestion.instructions) setNotes(suggestion.instructions)
    if (suggestionTimes.length > 0) setTimes(suggestionTimes)

    if (!nextName || !nextDosage || nextTimes.length === 0) return

    setSafetyChecking(true)
    setError(null)
    try {
      const result = await runSafetyCheck({
        name: nextName,
        dosage: nextDosage,
        frequency: suggestion.frequency ?? `${nextTimes.length} mahal / kun`,
        times: nextTimes,
        instructions: nextNotes || null,
        disease: nextDisease || null,
      })
      if (result.review_required) {
        toast.warning("Retseptdan olingan dori bo'yicha signal bor. Tahlil kartasini ko'rib chiqing.")
      } else {
        toast.success("Retseptdan olingan dori tahlil qilindi")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Dori tahlili bajarilmadi"
      setError(message)
      toast.error(message)
    } finally {
      setSafetyChecking(false)
    }
  }

  useEffect(() => {
    const raw = window.sessionStorage.getItem("noskipai-medication-prefill")
    if (!raw) return
    window.sessionStorage.removeItem("noskipai-medication-prefill")

    try {
      const prefill = JSON.parse(raw) as Record<string, unknown>
      const nextName = typeof prefill.name === "string" ? prefill.name : ""
      const nextDosage = typeof prefill.dosage === "string" ? prefill.dosage : ""
      const nextDisease = typeof prefill.disease === "string" ? prefill.disease : ""
      const nextNotes = typeof prefill.instructions === "string" ? prefill.instructions : ""
      const nextFrequency = typeof prefill.frequency === "string" ? prefill.frequency : null
      const nextTimes =
        Array.isArray(prefill.times) && prefill.times.some((item) => typeof item === "string")
          ? prefill.times.filter((item): item is string => typeof item === "string" && item.length > 0)
          : ["08:00"]

      setSafetyCheck(null)
      setPrescriptionSuggestions([])
      setPrescriptionSummary("Chatdagi rasm tahlilidan formaga qo'llandi.")
      if (nextName) setName(nextName)
      if (nextDosage) setDosage(nextDosage)
      if (nextDisease) setDisease(nextDisease)
      if (nextNotes) setNotes(nextNotes)
      if (nextTimes.length > 0) setTimes(nextTimes)

      if (!nextName || !nextDosage || nextTimes.length === 0) {
        toast.info("Rasmdan topilgan dori formaga tushdi. Doza yoki vaqtni to'ldirib tahlil qiling.")
        return
      }

      setSafetyChecking(true)
      setError(null)
      api
        .medicationSafetyCheck({
          name: nextName,
          dosage: nextDosage,
          frequency: nextFrequency ?? `${nextTimes.length} mahal / kun`,
          times: nextTimes,
          instructions: nextNotes || null,
          disease: nextDisease || null,
        })
        .then((result) => {
          setSafetyCheck(result)
          if (result.review_required) {
            toast.warning("Rasmdan olingan dori bo'yicha signal bor. Tahlil kartasini ko'rib chiqing.")
          } else {
            toast.success("Rasmdan olingan dori tahlil qilindi")
          }
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : "Dori tahlili bajarilmadi"
          setError(message)
          toast.error(message)
        })
        .finally(() => setSafetyChecking(false))
    } catch {
      toast.error("Rasmdan olingan dori ma'lumoti o'qilmadi")
    }
  }, [])

  const applyDrugSearchResult = async (result: DrugSearchResult) => {
    const nextName = result.name || name
    if (!nextName) return

    setName(nextName)
    setDrugSearchResults([])
    setSafetyCheck(null)

    if (!dosage || times.length === 0) {
      toast.info("Dori topildi. Endi doza va qabul vaqtini kiriting.")
      return
    }

    setSafetyChecking(true)
    setError(null)
    try {
      const check = await runSafetyCheck({ name: nextName })
      if (check.review_required) {
        toast.warning("Tanlangan dori bo'yicha signal bor. Tahlil kartasini ko'rib chiqing.")
      } else {
        toast.success("Tanlangan dori rasmiy baza orqali tahlil qilindi")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Dori tahlili bajarilmadi"
      setError(message)
      toast.error(message)
    } finally {
      setSafetyChecking(false)
    }
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
                    {[suggestion.frequency, suggestion.times.join(", "), suggestion.instructions].filter(Boolean).join(" · ") ||
                      "Formaga qo'llash va tahlil qilish"}
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
                  onChange={(e) => {
                    setName(e.target.value)
                    setSafetyCheck(null)
                  }}
                  placeholder={t("meds.namePlaceholder")}
                  className="h-12 rounded-xl"
                  required
                />
                <FieldDescription>{t("meds.nameHint")}</FieldDescription>
                {(drugSearching || drugSearchResults.length > 0) && (
                  <div className="mt-2 rounded-xl border border-border/60 bg-background shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
                      <span className="text-xs font-medium text-foreground">Rasmiy baza bo'yicha mos dorilar</span>
                      {drugSearching && <Spinner className="size-3.5" />}
                    </div>
                    {drugSearchResults.length > 0 ? (
                      <div className="divide-y divide-border/50">
                        {drugSearchResults.map((result) => {
                          const ingredients = result.ingredients.map((item) => item.name).filter(Boolean).join(", ")
                          return (
                            <button
                              key={`${result.rxcui || result.name}-${result.source}`}
                              type="button"
                              onClick={() => void applyDrugSearchResult(result)}
                              className="w-full px-3 py-2 text-left transition-colors hover:bg-primary/5"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">{result.name || "Noma'lum dori"}</span>
                                {result.rxcui && <Badge variant="secondary">RxCUI: {result.rxcui}</Badge>}
                                {result.score != null && <Badge variant="outline">Moslik: {result.score}%</Badge>}
                                <Badge variant="outline">{result.source}</Badge>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Faol modda: {ingredients || "aniqlashtirish kerak"}
                              </p>
                              {result.matched_text && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Topilgan yozuv: {result.matched_text}
                                </p>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      !drugSearching && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          Aniq moslik topilmadi. Qutidagi nomni rasm orqali yuborib ko'ring.
                        </p>
                      )
                    )}
                  </div>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="dosage">{t("meds.dosage")}</FieldLabel>
                <Input
                  id="dosage"
                  value={dosage}
                  onChange={(e) => {
                    setDosage(e.target.value)
                    setSafetyCheck(null)
                  }}
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
                  onChange={(e) => {
                    setDisease(e.target.value)
                    setSafetyCheck(null)
                  }}
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
                  onChange={(e) => {
                    setNotes(e.target.value)
                    setSafetyCheck(null)
                  }}
                  placeholder={t("meds.notesPlaceholder")}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <SafetyCheckCard
          check={safetyCheck}
          disabled={!name || !dosage || times.length === 0 || safetyChecking || submitting}
          loading={safetyChecking}
          onCheck={handleSafetyCheck}
        />

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
            disabled={submitting || safetyChecking || !name || !dosage || times.length === 0}
            className="rounded-xl"
          >
            {submitting && <Spinner className="size-4" />}
            {submitting ? (safetyCheck ? t("common.saving") : "Tahlil qilinmoqda...") : safetyCheck ? t("meds.save") : "Avval tahlil qilish"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function SafetyCheckCard({
  check,
  disabled,
  loading,
  onCheck,
}: {
  check: MedicationSafetyCheck | null
  disabled: boolean
  loading: boolean
  onCheck: () => void
}) {
  const severityClass =
    check?.recommendation_level === "caution" || check?.recommendation_level === "urgent"
      ? "border-destructive/30 bg-destructive/5"
      : check?.review_required
        ? "border-amber-300/50 bg-amber-50/70"
        : "border-primary/20 bg-primary/5"

  return (
    <Card className={`mt-4 rounded-2xl ${severityClass}`}>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Rasmiy data + AI dori tahlili</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                RxNorm faol moddani topadi, openFDA/DailyMed labelni tekshiradi, AI esa jadval va bemor konteksti bilan xulosa qiladi.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" className="rounded-xl bg-background" disabled={disabled} onClick={onCheck}>
            {loading ? <Spinner className="size-4" /> : <ShieldCheck className="size-4" />}
            Tahlil qilish
          </Button>
        </div>

        {check && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={check.review_required ? "outline" : "secondary"} className="gap-1.5">
                {check.review_required ? <AlertTriangle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                {check.review_required ? "Review kerak" : "Signal yo'q"}
              </Badge>
              <Badge variant="outline">Daraja: {check.recommendation_level}</Badge>
              <Badge variant="outline">{check.schedule_complexity.daily_doses} kunlik doza</Badge>
            </div>

            <p className="rounded-xl border border-border/60 bg-background px-3 py-2 text-sm">{check.patient_message}</p>

            <div className="rounded-xl border border-border/60 bg-background p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Dori knowledge-card</span>
                {check.drug_knowledge.rxcui ? (
                  <Badge variant="secondary">RxCUI: {check.drug_knowledge.rxcui}</Badge>
                ) : (
                  <Badge variant="outline">Aniq topilmadi</Badge>
                )}
              </div>
              <p className="mt-2 text-muted-foreground">{check.drug_knowledge.patient_summary}</p>
              {check.drug_knowledge.ingredients.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Faol modda: {check.drug_knowledge.ingredients.map((item) => item.name).filter(Boolean).join(", ")}
                </p>
              )}
              {check.drug_knowledge.official_sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {check.drug_knowledge.official_sources.map((source) => (
                    <a key={`${source.name}-${source.status}`} href={source.url} target="_blank" rel="noreferrer" className="inline-flex">
                      <Badge variant={source.status === "found" ? "secondary" : "outline"} className="gap-1">
                        {source.name}: {source.status}
                        <ExternalLink className="size-3" />
                      </Badge>
                    </a>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Doza: {check.drug_knowledge.dose_review.message}</p>
              <DoseEstimateBadges knowledge={check.drug_knowledge} className="mt-2" />
              <p
                className={`mt-2 rounded-lg px-2 py-1.5 text-xs ${
                  check.drug_knowledge.daily_dose_review.level === "caution"
                    ? "bg-destructive/10 text-destructive"
                    : check.drug_knowledge.daily_dose_review.level === "review"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-muted/40 text-muted-foreground"
                }`}
              >
                Kunlik doza: {check.drug_knowledge.daily_dose_review.message}
              </p>
              <div className="mt-2 rounded-lg border border-border/60 bg-muted/30 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-foreground">Qanday ichish</span>
                  <Badge variant="outline">{check.drug_knowledge.administration_review.meal_timing}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{check.drug_knowledge.administration_review.timing_message}</p>
                {check.drug_knowledge.administration_review.timing_suggestions.slice(0, 2).map((item) => (
                  <p key={item} className="mt-1 text-xs text-muted-foreground">
                    {item}
                  </p>
                ))}
              </div>
              {check.drug_knowledge.label_evidence.found && (
                <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {check.drug_knowledge.label_evidence.has_active_ingredient && <Badge variant="outline">FDA: active ingredient</Badge>}
                    {check.drug_knowledge.label_evidence.has_dosage_and_administration && <Badge variant="outline">FDA: dosage</Badge>}
                    {check.drug_knowledge.label_evidence.has_drug_interactions && <Badge variant="outline">FDA: interactions</Badge>}
                    {check.drug_knowledge.label_evidence.has_contraindications && <Badge variant="outline">FDA: contraindications</Badge>}
                    {check.drug_knowledge.label_evidence.has_warnings && <Badge variant="outline">FDA: warnings</Badge>}
                    {check.drug_knowledge.label_evidence.has_boxed_warning && <Badge variant="destructive">boxed warning</Badge>}
                  </div>
                  {check.drug_knowledge.label_evidence.snippets.slice(0, 2).map((snippet) => (
                    <p key={snippet.section} className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{snippet.section}:</span> {snippet.text}
                    </p>
                  ))}
                </div>
              )}
              {check.drug_knowledge.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {check.drug_knowledge.warnings.slice(0, 2).map((warning) => (
                    <p key={warning} className="text-xs text-amber-700">
                      {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {check.potential_interactions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Tekshirish kerak bo'lgan joylar</p>
                {check.potential_interactions.slice(0, 2).map((item, index) => (
                  <div key={`${item.issue}-${index}`} className="rounded-xl border border-border/60 bg-background p-3 text-sm">
                    <div className="font-medium">{item.medications.join(" + ")}</div>
                    <p className="mt-1 text-muted-foreground">{item.issue}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Savol: {item.doctor_question}</p>
                  </div>
                ))}
              </div>
            )}

            {(check.contraindication_flags ?? []).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Bemor konteksti bo'yicha safety</p>
                {(check.contraindication_flags ?? []).slice(0, 3).map((flag) => (
                  <div key={`${flag.medication_id}-${flag.issue}`} className="rounded-xl border border-amber-300/50 bg-amber-50/70 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{flag.medication_name}</span>
                      <Badge variant={flag.severity === "caution" ? "destructive" : "outline"}>{flag.severity}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{flag.issue}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Amal: {flag.patient_action}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Savol: {flag.doctor_question}</p>
                  </div>
                ))}
              </div>
            )}

            {check.timing_suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Vaqt bo'yicha tavsiyalar</p>
                {check.timing_suggestions.slice(0, 2).map((item) => (
                  <p key={item} className="rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-muted-foreground">
                    {item}
                  </p>
                ))}
              </div>
            )}

            {(check.schedule_advisor?.timing_gap_rules ?? []).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Aniq interval risk</p>
                {(check.schedule_advisor?.timing_gap_rules ?? []).slice(0, 3).map((rule) => (
                  <div key={`${rule.medications.join("-")}-${rule.suggested_gap_minutes}`} className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{rule.medications.join(" + ")}</span>
                      <Badge variant={rule.severity === "caution" ? "destructive" : "outline"}>{rule.suggested_gap_minutes} min</Badge>
                    </div>
                    <p className="mt-2 text-muted-foreground">{rule.issue}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Amal: {rule.patient_action}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Savol: {rule.doctor_question}</p>
                  </div>
                ))}
              </div>
            )}

            {(check.schedule_advisor?.time_blocks ?? []).some((block) => block.level !== "ok") && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Jadval bloki tahlili</p>
                {(check.schedule_advisor?.time_blocks ?? [])
                  .filter((block) => block.level !== "ok")
                  .slice(0, 2)
                  .map((block) => (
                    <div key={block.time} className="rounded-xl border border-amber-300/50 bg-amber-50/70 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{block.time} bloki</span>
                        <Badge variant={block.level === "caution" ? "destructive" : "outline"}>{block.level}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {block.medications.map((medication) => `${medication.name} ${medication.dosage}`).join(", ")}
                      </p>
                      {block.issues[0] && <p className="mt-2 text-xs text-muted-foreground">{block.issues[0]}</p>}
                      <p className="mt-2 text-xs text-muted-foreground">Amal: {block.patient_action}</p>
                    </div>
                  ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">{check.disclaimer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DoseEstimateBadges({
  knowledge,
  className,
}: {
  knowledge: MedicationSafetyCheck["drug_knowledge"]
  className?: string
}) {
  const singleDose = knowledge.dose_review.estimated_single_dose_amount_mg
  const dailyDose = knowledge.daily_dose_review.estimated_daily_amount_mg
  if (singleDose == null && dailyDose == null) return null

  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
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
