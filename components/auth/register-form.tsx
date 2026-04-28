"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, HeartPulse, Loader2, Stethoscope, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/provider"
import { useAuth } from "@/lib/auth/provider"
import type { UserRole, Gender } from "@/lib/types"
import type { Locale } from "@/lib/i18n/translations"

const ROUTE_BY_ROLE = {
  patient: "/dashboard",
  family: "/family",
  doctor: "/doctor",
}

type FormState = {
  full_name: string
  phoneDigits: string
  password: string
  password2: string
  role: UserRole
  age: string
  gender: Gender
  language: Locale
  agree: boolean
}

export function RegisterForm() {
  const { t, locale } = useI18n()
  const { register } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FormState>({
    full_name: "",
    phoneDigits: "",
    password: "",
    password2: "",
    role: "patient",
    age: "",
    gender: "skip",
    language: locale,
    agree: false,
  })

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setData((d) => ({ ...d, [k]: v }))
  }

  function validateStep1() {
    if (!data.full_name.trim()) return "Ism familiya"
    if (!/^\d{9}$/.test(data.phoneDigits)) return "Telefon: 9 raqam"
    if (data.password.length < 6) return "Parol ≥ 6"
    if (data.password !== data.password2) return "Parollar mos emas"
    return null
  }

  function validateStep2() {
    if (data.age && (Number(data.age) < 1 || Number(data.age) > 120)) return "Yosh"
    return null
  }

  function next() {
    setError(null)
    if (step === 1) {
      const err = validateStep1()
      if (err) {
        setError(err)
        return
      }
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) {
        setError(err)
        return
      }
    }
    setStep((s) => Math.min(s + 1, 3))
  }

  async function submit() {
    if (!data.agree) {
      setError(t("auth.terms"))
      return
    }
    setLoading(true)
    try {
      const user = await register({
        full_name: data.full_name,
        phone: "+998" + data.phoneDigits,
        password: data.password,
        role: data.role,
        age: data.age ? Number(data.age) : undefined,
        gender: data.gender,
        language: data.language,
      })
      toast.success(t("common.welcome"))
      router.push(ROUTE_BY_ROLE[user.role])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = [t("auth.stepBasic"), t("auth.stepProfile"), t("auth.stepConfirm")]
  const passStrength = passwordStrength(data.password)

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("auth.registerTitle")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("auth.step")} {step} {t("auth.of")} 3 — {stepLabels[step - 1]}
        </p>
      </div>

      <ProgressBar step={step} />

      <div className="mt-6 space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="full_name">{t("auth.fullName")}</Label>
              <Input
                id="full_name"
                className="h-11"
                value={data.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder={locale === "uz" ? "Aziza Karimova" : "Aziza Karimova"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("auth.phone")}</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm text-muted-foreground">+998</span>
                <Input
                  id="phone"
                  inputMode="numeric"
                  maxLength={9}
                  className="h-11 pl-14 tabular-nums"
                  placeholder="90 111 11 11"
                  value={data.phoneDigits}
                  onChange={(e) => update("phoneDigits", e.target.value.replace(/\D/g, "").slice(0, 9))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd">{t("auth.password")}</Label>
              <Input
                id="pwd"
                type="password"
                className="h-11"
                value={data.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <PasswordStrengthBar value={passStrength} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd2">{t("auth.confirmPassword")}</Label>
              <Input
                id="pwd2"
                type="password"
                className="h-11"
                value={data.password2}
                onChange={(e) => update("password2", e.target.value)}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label>{t("auth.role")}</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                <RoleCard
                  active={data.role === "patient"}
                  icon={HeartPulse}
                  label={t("auth.rolePatient")}
                  onClick={() => update("role", "patient")}
                />
                <RoleCard
                  active={data.role === "family"}
                  icon={Users}
                  label={t("auth.roleFamily")}
                  onClick={() => update("role", "family")}
                />
                <RoleCard
                  active={data.role === "doctor"}
                  icon={Stethoscope}
                  label={t("auth.roleDoctor")}
                  onClick={() => update("role", "doctor")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="age">{t("auth.age")}</Label>
                <Input
                  id="age"
                  inputMode="numeric"
                  className="h-11 tabular-nums"
                  value={data.age}
                  onChange={(e) => update("age", e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("auth.gender")}</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["male", "female", "skip"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update("gender", g)}
                      className={cn(
                        "h-11 rounded-xl border text-xs font-medium transition-colors",
                        data.gender === g
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {t(`auth.${g}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("auth.language")}</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["uz", "ru", "en"] as Locale[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => update("language", l)}
                    className={cn(
                      "h-11 rounded-xl border text-xs font-medium uppercase transition-colors",
                      data.language === l
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <SummaryRow label={t("auth.fullName")} value={data.full_name} />
            <SummaryRow label={t("auth.phone")} value={"+998 " + formatPhone(data.phoneDigits)} />
            <SummaryRow label={t("auth.role")} value={t(`auth.role${capitalize(data.role)}`)} />
            {data.age && <SummaryRow label={t("auth.age")} value={data.age} />}
            <SummaryRow label={t("auth.language")} value={data.language.toUpperCase()} />
            <label className="mt-3 flex items-start gap-2.5 rounded-2xl border border-border/60 bg-muted/30 p-3 text-sm">
              <Checkbox
                checked={data.agree}
                onCheckedChange={(v) => update("agree", Boolean(v))}
                className="mt-0.5"
                aria-label={t("auth.terms")}
              />
              <span className="text-muted-foreground">{t("auth.terms")}</span>
            </label>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="rounded-xl"
            >
              <ArrowLeft className="mr-1 size-4" />
              {t("common.back")}
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button type="button" onClick={next} className="ml-auto h-11 rounded-xl px-5">
              {t("common.next")}
              <ArrowRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={submit}
              disabled={loading}
              className="ml-auto h-11 rounded-xl px-5"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : (
                <>
                  <CheckCircle2 className="mr-1 size-4" />
                  {t("common.register")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("common.login")}
        </Link>
      </p>
    </div>
  )
}

function ProgressBar({ step }: { step: number }) {
  const pct = (step / 3) * 100
  return (
    <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full bg-primary transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function RoleCard({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition-all",
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40",
      )}
      aria-pressed={active}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </button>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function PasswordStrengthBar({ value }: { value: number }) {
  const colors = ["var(--risk-critical)", "var(--risk-high)", "var(--risk-medium)", "var(--risk-low)"]
  const labels = ["weak", "ok", "good", "strong"]
  if (value === 0) return null
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: i < value ? colors[value - 1] : "var(--muted)" }}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium" style={{ color: colors[value - 1] }}>
        {labels[value - 1]}
      </p>
    </div>
  )
}

function passwordStrength(p: string): number {
  let s = 0
  if (p.length >= 6) s++
  if (p.length >= 10) s++
  if (/\d/.test(p) && /[a-zA-Z]/.test(p)) s++
  if (/[^a-zA-Z0-9]/.test(p)) s++
  return Math.min(s, 4)
}

function formatPhone(d: string) {
  return d.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4")
}

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}
