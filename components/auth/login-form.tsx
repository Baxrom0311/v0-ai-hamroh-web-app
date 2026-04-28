"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Lock, Phone } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useI18n } from "@/lib/i18n/provider"
import { useAuth } from "@/lib/auth/provider"

const ROUTE_BY_ROLE = {
  patient: "/dashboard",
  family: "/family",
  doctor: "/doctor",
}

export function LoginForm() {
  const { t } = useI18n()
  const { login } = useAuth()
  const router = useRouter()

  const [phoneDigits, setPhoneDigits] = useState("901111111")
  const [password, setPassword] = useState("demo1234")
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!/^\d{9}$/.test(phoneDigits)) {
      setError(t("auth.phone") + " — 9 " + t("common.minutes").replace("daqiqa", "raqam"))
      return
    }
    if (password.length < 6) {
      setError(t("auth.password") + " ≥ 6")
      return
    }

    setLoading(true)
    try {
      const user = await login("+998" + phoneDigits, password)
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

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("auth.loginTitle")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>
      </div>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("auth.phone")}</Label>
          <div className="relative flex items-center">
            <span className="absolute left-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-4" />
              +998
            </span>
            <Input
              id="phone"
              inputMode="numeric"
              maxLength={9}
              className="h-12 pl-20 tabular-nums"
              placeholder="90 111 11 11"
              value={phoneDigits}
              onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
              autoComplete="tel-national"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              className="h-12 pl-10 pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={showPwd ? "Hide" : "Show"}
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <Checkbox
              checked={remember}
              onCheckedChange={(v) => setRemember(Boolean(v))}
              aria-label={t("auth.rememberMe")}
            />
            {t("auth.rememberMe")}
          </label>
          <Link href="#" className="text-primary hover:underline">
            {t("auth.forgotPassword")}
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : t("common.login")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t("common.register")}
          </Link>
        </p>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">
        {t("auth.demoHint")}
      </div>
    </div>
  )
}
