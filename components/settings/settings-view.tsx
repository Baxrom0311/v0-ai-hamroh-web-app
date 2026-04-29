"use client"

import { useEffect, useState } from "react"
import { useT } from "@/lib/i18n/provider"
import { useAuth } from "@/lib/auth/provider"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { localeNames, type Locale } from "@/lib/i18n/translations"
import {
  User,
  Globe,
  Send,
  Bell,
  Shield,
  Info,
  Check,
  Copy,
  Heart,
  ChevronRight,
  LogOut,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "profile" | "language" | "telegram" | "reminders" | "security" | "about"

export function SettingsView() {
  const { t, locale, setLocale } = useT()
  const { user, logout, refreshUser } = useAuth()
  const [tab, setTab] = useState<Tab>("profile")

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: t("settings.tabProfile"), icon: <User className="size-4" /> },
    { id: "language", label: t("settings.tabLanguage"), icon: <Globe className="size-4" /> },
    { id: "telegram", label: t("settings.tabTelegram"), icon: <Send className="size-4" /> },
    { id: "reminders", label: t("settings.tabReminders"), icon: <Bell className="size-4" /> },
    { id: "security", label: t("settings.tabSecurity"), icon: <Shield className="size-4" /> },
    { id: "about", label: t("settings.tabAbout"), icon: <Info className="size-4" /> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">{t("settings.title")}</h1>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-6">
        {/* Mobile: horizontal scrolling tabs */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto">
          <TabsList className="bg-muted/60 rounded-xl h-11 w-max">
            {tabs.map((tt) => (
              <TabsTrigger key={tt.id} value={tt.id} className="rounded-lg gap-2">
                {tt.icon}
                {tt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-6">
          {/* Desktop: vertical sidebar */}
          <aside className="hidden lg:block">
            <Card className="rounded-2xl border-border/60 sticky top-20">
              <CardContent className="p-2">
                <nav className="space-y-1" aria-label={t("settings.title")}>
                  {tabs.map((tt) => (
                    <button
                      key={tt.id}
                      onClick={() => setTab(tt.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                        tab === tt.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted/60",
                      )}
                    >
                      {tt.icon}
                      <span className="flex-1">{tt.label}</span>
                      {tab === tt.id && <ChevronRight className="size-4 opacity-60" />}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          <div className="min-w-0">
            <TabsContent value="profile" className="m-0">
              <ProfilePanel name={user?.full_name || "Demo User"} phone={user?.phone || "+998 90 111 11 11"} />
            </TabsContent>
            <TabsContent value="language" className="m-0">
              <LanguagePanel locale={locale} onChange={setLocale} />
            </TabsContent>
            <TabsContent value="telegram" className="m-0">
              <TelegramPanel connected={!!user?.telegram_id} onLinked={refreshUser} />
            </TabsContent>
            <TabsContent value="reminders" className="m-0">
              <RemindersPanel />
            </TabsContent>
            <TabsContent value="security" className="m-0">
              <SecurityPanel onLogout={logout} />
            </TabsContent>
            <TabsContent value="about" className="m-0">
              <AboutPanel />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

function ProfilePanel({ name, phone }: { name: string; phone: string }) {
  const { t } = useT()
  const [editing, setEditing] = useState(false)
  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{t("settings.tabProfile")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{name}</p>
            <p className="text-sm text-muted-foreground font-mono truncate">{phone}</p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl bg-transparent"
            onClick={() => setEditing(!editing)}
          >
            {editing ? t("common.cancel") : t("common.edit")}
          </Button>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel>{t("auth.fullName")}</FieldLabel>
            <Input defaultValue={name} disabled={!editing} className="h-12 rounded-xl" />
          </Field>
          <Field>
            <FieldLabel>{t("auth.phone")}</FieldLabel>
            <Input defaultValue={phone} disabled className="h-12 rounded-xl font-mono" />
            <FieldDescription>{t("settings.phoneFixed")}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>{t("auth.age")}</FieldLabel>
            <Input type="number" defaultValue="62" disabled={!editing} className="h-12 rounded-xl" />
          </Field>
        </FieldGroup>

        {editing && (
          <div className="flex justify-end">
            <Button className="rounded-xl" onClick={() => setEditing(false)}>
              {t("common.save")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LanguagePanel({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  const { t } = useT()
  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{t("settings.tabLanguage")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
        <div className="space-y-2">
          {(Object.keys(localeNames) as Locale[]).map((loc) => (
            <button
              key={loc}
              onClick={() => onChange(loc)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                locale === loc
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/60 hover:border-border bg-card",
              )}
            >
              <div className="size-10 rounded-lg bg-secondary/60 flex items-center justify-center text-sm font-semibold uppercase tabular-nums">
                {loc}
              </div>
              <div className="flex-1">
                <p className="font-medium">{localeNames[loc]}</p>
              </div>
              {locale === loc && (
                <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="size-4" />
                </div>
              )}
            </button>
          ))}
        </div>
        <Field>
          <FieldLabel>{t("settings.timezone")}</FieldLabel>
          <Select defaultValue="Asia/Tashkent">
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Tashkent">Asia/Tashkent (UTC+5)</SelectItem>
              <SelectItem value="Asia/Almaty">Asia/Almaty (UTC+5)</SelectItem>
              <SelectItem value="Europe/Moscow">Europe/Moscow (UTC+3)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </CardContent>
    </Card>
  )
}

function TelegramPanel({ connected: connectedFromUser, onLinked }: { connected: boolean; onLinked: () => Promise<unknown> }) {
  const { t } = useT()
  const [connected, setConnected] = useState(connectedFromUser)
  const [connecting, setConnecting] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [botUsername, setBotUsername] = useState("AIHamrohBot")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setConnected(connectedFromUser)
  }, [connectedFromUser])

  useEffect(() => {
    api.appConfig().then((config) => {
      if (config.telegram_bot_username) setBotUsername(config.telegram_bot_username.replace(/^@/, ""))
    }).catch(() => {
      // Public config is optional for this panel.
    })
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const response = await api.telegramLinkCode()
      setCode(response.code)
      setExpiresAt(response.expires_at)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Telegram kod olinmadi")
    } finally {
      setConnecting(false)
    }
  }

  const copyCode = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{t("settings.tabTelegram")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center">
            <Send className="size-6" />
          </div>
          <div className="flex-1">
            <p className="font-medium">@{botUsername}</p>
            <p className="text-xs text-muted-foreground">/start {code ?? "CODE"}</p>
            <Badge
              variant="secondary"
              className={cn(
                "mt-1 rounded-md text-xs",
                connected
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full mr-1.5",
                  connected ? "bg-primary" : "bg-muted-foreground",
                )}
              />
              {connected ? t("settings.telegramConnected") : t("settings.telegramNotConnected")}
            </Badge>
          </div>
        </div>

        {!connected && !code && (
          <Button onClick={handleConnect} disabled={connecting} size="lg" className="w-full rounded-xl">
            {connecting ? t("common.loading") : t("settings.telegramConnect")}
          </Button>
        )}

        {code && !connected && (
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 space-y-4">
            <p className="text-sm text-foreground/80">{t("settings.telegramCode")}</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-2xl font-mono font-semibold tracking-widest text-center py-3 rounded-xl bg-background border border-border/60">
                {code}
              </code>
              <Button size="icon" variant="outline" onClick={copyCode} className="size-12 rounded-xl bg-transparent">
                {copied ? <Check className="size-5 text-primary" /> : <Copy className="size-5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.telegramExpires")}: {expiresAt ? `${minutesLeft(expiresAt)} min` : "10 min"}
            </p>
            <Button asChild size="sm" className="w-full rounded-xl">
              <a href={`https://t.me/${botUsername}?start=${encodeURIComponent(code)}`} target="_blank" rel="noreferrer">
                @{botUsername} ni ochish
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await onLinked()
              }}
              className="w-full rounded-xl text-muted-foreground"
            >
              Bog'lanishni tekshirish
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {connected && (
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="size-5" />
              </div>
              <div>
                <p className="font-medium">{t("settings.telegramSuccess")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.telegramSuccessDesc")}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConnected(false)
                setCode(null)
              }}
              className="rounded-xl bg-transparent"
            >
              {t("settings.telegramDisconnect")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function minutesLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 60000))
}

function RemindersPanel() {
  const { t } = useT()
  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{t("settings.tabReminders")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 divide-y divide-border/60">
        <SettingRow
          label={t("settings.pushNotifications")}
          desc={t("settings.pushDesc")}
          control={<Switch defaultChecked />}
        />
        <SettingRow
          label={t("settings.telegramReminders")}
          desc={t("settings.telegramRemindersDesc")}
          control={<Switch defaultChecked />}
        />
        <SettingRow
          label={t("settings.reminderBefore")}
          desc={t("settings.reminderBeforeDesc")}
          control={
            <Select defaultValue="15">
              <SelectTrigger className="w-[120px] h-10 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 min</SelectItem>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingRow
          label={t("settings.quietHours")}
          desc={t("settings.quietHoursDesc")}
          control={
            <div className="flex items-center gap-2 font-mono text-sm">
              <Input type="time" defaultValue="22:00" className="w-[100px] h-10 rounded-lg" />
              <span className="text-muted-foreground">—</span>
              <Input type="time" defaultValue="07:00" className="w-[100px] h-10 rounded-lg" />
            </div>
          }
        />
        <SettingRow
          label={t("settings.familyEnabled")}
          desc={t("settings.familyEnabledDesc")}
          control={<Switch defaultChecked />}
          icon={<Heart className="size-4 text-primary" />}
        />
      </CardContent>
    </Card>
  )
}

function SecurityPanel({ onLogout }: { onLogout: () => void }) {
  const { t } = useT()
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">{t("settings.tabSecurity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted/60 transition-colors text-left">
            <div className="size-10 rounded-xl bg-secondary/60 flex items-center justify-center">
              <Shield className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{t("settings.changePassword")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.changePasswordDesc")}</p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted/60 transition-colors text-left"
          >
            <div className="size-10 rounded-xl bg-secondary/60 flex items-center justify-center">
              <LogOut className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{t("common.logout")}</p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-destructive">{t("settings.deleteAccount")}</p>
              <p className="text-sm text-foreground/80 mt-1">{t("settings.deleteAccountDesc")}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
              >
                {t("settings.deleteAccount")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AboutPanel() {
  const { t } = useT()
  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{t("settings.tabAbout")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
            AI
          </div>
          <div>
            <p className="font-semibold">AI Hamroh</p>
            <p className="text-muted-foreground">{t("settings.version")} 1.0.0</p>
          </div>
        </div>
        <div className="space-y-1 pt-2 border-t border-border/60">
          <a href="#" className="block py-2 text-foreground hover:text-primary">
            {t("settings.aboutTerms")}
          </a>
          <a href="#" className="block py-2 text-foreground hover:text-primary">
            {t("settings.aboutPrivacy")}
          </a>
          <a href="#" className="block py-2 text-foreground hover:text-primary">
            {t("settings.aboutContact")}
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

function SettingRow({
  label,
  desc,
  control,
  icon,
}: {
  label: string
  desc?: string
  control: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-start sm:items-center gap-4 py-4 first:pt-0 last:pb-0 flex-col sm:flex-row">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm flex items-center gap-2">
          {icon}
          {label}
        </p>
        {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
      </div>
      <div className="shrink-0 self-start sm:self-center">{control}</div>
    </div>
  )
}
