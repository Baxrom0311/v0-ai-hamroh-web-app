"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowDown, BrainCircuit, CheckCircle2, ExternalLink, ImagePlus, Mic, Pill, Send, Sparkles, Stethoscope, ThumbsDown, ThumbsUp, Users } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n/provider"
import { api, type ChatImageReply, type PrescriptionMedicationSuggestion } from "@/lib/api"
import { fileToBase64 } from "@/lib/image-file"
import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

type ChatViewMessage = ChatMessage & { image_analysis?: ChatImageReply }

export function ChatView() {
  const { t } = useI18n()
  const router = useRouter()
  const [messages, setMessages] = useState<ChatViewMessage[]>([])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [showJump, setShowJump] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const quickReplies = useMemo(
    () => [
      { id: "side_effect", label: t("chat.quickSideEffect") },
      { id: "forgot", label: t("chat.quickForgot") },
      { id: "feel_bad", label: t("chat.quickFeelBad") },
      { id: "question", label: t("chat.quickQuestion") },
      { id: "stop", label: t("chat.quickStop") },
    ],
    [t],
  )

  useEffect(() => {
    let cancelled = false
    async function loadHistory() {
      try {
        const history = await api.chatHistory(50)
        if (cancelled) return
        setMessages(
          history.length
            ? history.map((item, index) => ({
                id: index + 1,
                role: item.role,
                content: item.content.replace(/^__checkin__.*$/g, t("dashboard.moodThanks")),
                timestamp: item.timestamp,
              }))
            : [
                {
                  id: 1,
                  role: "assistant",
                  content: t("chat.welcome"),
                  timestamp: new Date().toISOString(),
                },
              ],
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Chat yuklanmadi")
        setMessages([
          {
            id: 1,
            role: "assistant",
            content: t("chat.welcome"),
            timestamp: new Date().toISOString(),
          },
        ])
      }
    }
    loadHistory()
    return () => {
      cancelled = true
    }
  }, [t])

  useEffect(() => {
    const draft = window.sessionStorage.getItem("noskipai-chat-draft")
    if (!draft) return
    window.sessionStorage.removeItem("noskipai-chat-draft")
    setInput(draft)
  }, [])

  function scrollToBottom(smooth = true) {
    endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" })
  }

  useEffect(() => {
    scrollToBottom(false)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, typing])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowJump(dist > 200)
  }

  async function send(content: string) {
    if (!content.trim() || typing) return
    const text = content.trim()
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setTyping(true)
    try {
      const response = await api.chat(text)
      const reply: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toISOString(),
        risk_flag: response.risk_flag,
        requires_urgent_help: response.requires_urgent_help,
        dialogue_reason: response.dialogue_reason,
        rescue_plan: response.rescue_plan,
        escalation: response.escalation,
        medication_intelligence: response.medication_intelligence,
        candidate_medication_safety: response.candidate_medication_safety,
        drug_knowledge: response.drug_knowledge,
        daily_guidance: response.daily_guidance,
        adherence_summary: response.adherence_summary,
        adherence_log_action: response.adherence_log_action,
        adherence_log_actions: response.adherence_log_actions,
        evidence_cards: response.evidence_cards,
        safety_level: response.safety_level,
        intent: response.intent,
        suggested_actions: response.suggested_actions.map((item) =>
          typeof item === "string"
            ? { label: item, action: item }
            : { id: item.id, label: item.label, action: item.message || item.label },
        ),
      }
      setMessages((m) => [...m, reply])
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI javob bermadi"
      toast.error(message)
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: message,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setTyping(false)
    }
  }

  async function sendImage(file: File) {
    if (typing) return
    const prompt = input.trim() || "Rasmni tahlil qilib ber"
    const userMsg: ChatViewMessage = {
      id: Date.now(),
      role: "user",
      content: `Rasm yukladim: ${file.name}`,
      timestamp: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setTyping(true)
    try {
      const imageBase64 = await fileToBase64(file)
      const response = await api.chatImage({
        image_base64: imageBase64,
        mime_type: file.type || "image/jpeg",
        message: prompt,
      })
      const reply: ChatViewMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toISOString(),
        risk_flag: response.risk_flag,
        image_analysis: response,
        suggested_actions: response.suggested_actions.map((item) =>
          typeof item === "string"
            ? { label: item, action: item }
            : { id: item.id, label: item.label, action: item.message || item.label },
        ),
      }
      setMessages((m) => [...m, reply])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rasm tahlil qilinmadi"
      toast.error(message)
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: message,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setTyping(false)
    }
  }

  function applyImageSuggestion(suggestion: PrescriptionMedicationSuggestion) {
    const suggestionTimes = Array.isArray(suggestion.times) ? suggestion.times.filter(Boolean) : []
    const payload = {
      name: suggestion.name ?? "",
      dosage: suggestion.dosage ?? "",
      frequency: suggestion.frequency,
      times: suggestionTimes.length > 0 ? suggestionTimes : ["08:00"],
      instructions: suggestion.instructions ?? "",
      disease: suggestion.disease ?? "",
      source: "chat-image",
    }

    try {
      window.sessionStorage.setItem("noskipai-medication-prefill", JSON.stringify(payload))
      toast.success("Dori formaga yuborildi")
      router.push("/medications/add")
    } catch {
      toast.error("Dorini formaga yuborib bo'lmadi")
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem-4rem)] w-full max-w-3xl flex-col px-0 sm:h-[calc(100svh-4rem-4rem)] sm:px-4 lg:h-[calc(100svh-4rem)]">
      <div className="flex items-center gap-3 border-b border-border/60 bg-card px-4 py-3 sm:mt-4 sm:rounded-t-3xl sm:border sm:border-border/60">
        <Avatar className="size-10 ring-2 ring-primary/20">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t("chat.title")}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {typing ? (
              <>
                <span className="inline-flex items-center gap-0.5">
                  <span className="typing-dot inline-block size-1 rounded-full bg-primary" />
                  <span className="typing-dot inline-block size-1 rounded-full bg-primary" />
                  <span className="typing-dot inline-block size-1 rounded-full bg-primary" />
                </span>
                {t("chat.typing")}
              </>
            ) : (
              <>
                <span className="size-2 rounded-full bg-[var(--risk-low)]" />
                {t("chat.online")}
              </>
            )}
          </p>
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="relative flex-1 overflow-y-auto bg-muted/30 px-4 py-5 sm:border-x sm:border-border/60">
        <ul className="space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              prev={messages[i - 1]}
              onAction={(action) => send(action)}
              onApplyMedicationSuggestion={applyImageSuggestion}
            />
          ))}
          {typing && <TypingBubble />}
        </ul>
        <div ref={endRef} />
        {showJump && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="sticky bottom-3 ml-auto mr-3 mt-3 flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-muted"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="size-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto bg-card px-4 py-2 sm:border-x sm:border-border/60">
        {quickReplies.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => send(q.label)}
            className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="border-t border-border/60 bg-card px-4 py-3 sm:rounded-b-3xl sm:border sm:border-border/60">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-end gap-2"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <ImagePlus className="size-4" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    disabled={typing}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ""
                      if (file) void sendImage(file)
                    }}
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>Rasm yuklash</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="size-10 shrink-0 rounded-full">
                  <Mic className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("chat.voiceTooltip")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder={t("chat.placeholder")}
            rows={1}
            className="flex max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-primary"
          />
          <Button type="submit" size="icon" className="size-10 shrink-0 rounded-full" disabled={!input.trim() || typing} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("chat.disclaimer")}</p>
      </div>
    </div>
  )
}

function MessageBubble({
  msg,
  prev,
  onAction,
  onApplyMedicationSuggestion,
}: {
  msg: ChatViewMessage
  prev?: ChatViewMessage
  onAction: (action: string) => void
  onApplyMedicationSuggestion: (suggestion: PrescriptionMedicationSuggestion) => void
}) {
  const isUser = msg.role === "user"
  const showAvatar = !prev || prev.role !== msg.role
  const time = new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })

  return (
    <li className={cn("flex w-full gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-8 shrink-0">
          {showAvatar && (
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
      <div className={cn("max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div className={cn("rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm", isUser ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border/60 bg-card text-foreground")}>
          {msg.dialogue_reason && !isUser && (
            <Badge variant="secondary" className="mb-2">
              {reasonLabel(msg.dialogue_reason)}
            </Badge>
          )}
          {msg.content}
        </div>
        {!isUser && msg.rescue_plan && <RescuePlanCard plan={msg.rescue_plan} />}
        {!isUser && msg.escalation?.triggered && <EscalationStatusCard escalation={msg.escalation} />}
        {!isUser && msg.daily_guidance && <DailyGuidanceCard guidance={msg.daily_guidance} />}
        {!isUser && (msg.adherence_log_actions?.length ?? 0) > 1 && <AdherenceLogActionsCard actions={msg.adherence_log_actions ?? []} />}
        {!isUser && !(msg.adherence_log_actions?.length && msg.adherence_log_actions.length > 1) && msg.adherence_log_action && <AdherenceLogActionCard action={msg.adherence_log_action} />}
        {!isUser && msg.adherence_summary && <AdherenceSummaryCard summary={msg.adherence_summary} />}
        {!isUser && msg.image_analysis && <ChatImageAnalysisCard analysis={msg.image_analysis} onApplySuggestion={onApplyMedicationSuggestion} />}
        {!isUser && msg.drug_knowledge && <DrugKnowledgeCard knowledge={msg.drug_knowledge} />}
        {!isUser && msg.medication_intelligence && <MedicationIntelligenceCard intelligence={msg.medication_intelligence} />}
        {!isUser && msg.candidate_medication_safety && <CandidateMedicationSafetyCard review={msg.candidate_medication_safety} />}
        {!isUser && msg.evidence_cards && msg.evidence_cards.length > 0 && <EvidenceCardsPanel cards={msg.evidence_cards} />}
        {msg.suggested_actions && msg.suggested_actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.suggested_actions.map((a, i) => (
              <Button key={i} size="sm" variant="outline" onClick={() => onAction(a.action)} className="rounded-full">
                {a.label}
              </Button>
            ))}
          </div>
        )}
        {(msg.requires_urgent_help || msg.rescue_plan?.escalation === "emergency") && <CrisisCard />}
        {!isUser && msg.content && <FeedbackButtons content={msg.content} />}
        <p className={cn("mt-1 text-[11px] text-muted-foreground", isUser ? "text-right" : "text-left")}>{time}</p>
      </div>
    </li>
  )
}

function reasonLabel(reason: NonNullable<ChatMessage["dialogue_reason"]>) {
  const labels = {
    side_effect: "Sabab: yon ta'sir",
    fatigue: "Sabab: charchoq",
    money: "Sabab: pul masalasi",
    depression: "Sabab: tushkunlik",
    stigma: "Sabab: maxfiylik",
    asymptomatic: "Sabab: foydasini sezmaslik",
    forgetfulness: "Sabab: unutish",
    confusion: "Sabab: dori chalkashuvi",
    family_support: "Sabab: qo'llov yetishmasligi",
    unknown: "Sababni aniqlash",
  }
  return labels[reason as keyof typeof labels] ?? "Sabab aniqlangan"
}

function DailyGuidanceCard({
  guidance,
}: {
  guidance: NonNullable<ChatMessage["daily_guidance"]>
}) {
  const weakPattern = guidance.weakest_medication_pattern
  const statusTone =
    guidance.missed_today > 0 || (weakPattern && weakPattern.rate < 80)
      ? "border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10"
      : "border-primary/20 bg-primary/5"

  return (
    <div className={cn("mt-3 overflow-hidden rounded-2xl border shadow-sm", statusTone)}>
      <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <BrainCircuit className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Kunlik AI xulosa</p>
            {guidance.top_signal_id ? (
              <Badge variant="destructive" className="rounded-full text-[11px]">
                safety signal #{guidance.top_signal_id}
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full bg-background/60 text-[11px]">
                real-time context
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Chat javobi bazadagi bugungi doza, safety signal va 7 kunlik pattern asosida tuzildi.
          </p>
        </div>
      </div>
      <div className="grid gap-2 px-4 py-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-background/70 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <AlertCircle className="size-3.5" />
            Bugun
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Missed: {guidance.missed_today} · Late: {guidance.late_today}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/70 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <CheckCircle2 className="size-3.5" />
            Keyingi doza
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{guidance.next_dose || "Bugun keyingi doza yo'q"}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/70 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Pill className="size-3.5" />
            Zaif pattern
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {weakPattern ? `${weakPattern.name}: ${weakPattern.rate}% · missed ${weakPattern.missed}/${weakPattern.due}` : "Muammo ko'rinmadi"}
          </p>
        </div>
      </div>
    </div>
  )
}

function AdherenceSummaryCard({
  summary,
}: {
  summary: NonNullable<ChatMessage["adherence_summary"]>
}) {
  const risky = summary.missed_7d > 0 || summary.late_7d > 1 || summary.adherence_rate_7d < 80
  const today = summary.today.slice(0, 5)
  const meds = summary.medications.slice(0, 3)

  return (
    <div className={cn("mt-3 overflow-hidden rounded-2xl border shadow-sm", risky ? "border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10" : "border-primary/20 bg-primary/5")}>
      <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", risky ? "bg-[var(--risk-high)] text-white" : "bg-primary text-primary-foreground")}>
          <CheckCircle2 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Ichgan-ichmagan tahlili</p>
            <Badge variant={risky ? "destructive" : "secondary"} className="rounded-full text-[11px]">
              {summary.adherence_rate_7d}% / 7 kun
            </Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary.recommendation}</p>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-xs font-semibold text-foreground">7 kun</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Missed: {summary.missed_7d} · Late: {summary.late_7d}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-xs font-semibold text-foreground">Bugungi doza</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.today.filter((item) => item.status === "taken" || item.status === "late").length}/{summary.today.length} bajarilgan
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-xs font-semibold text-foreground">Zaif dori</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {meds[0]?.rate !== null && meds[0] ? `${meds[0].name}: ${meds[0].rate}%` : "Yetarli data yo'q"}
            </p>
          </div>
        </div>

        {today.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Bugungi jadval</p>
            <div className="mt-2 space-y-2">
              {today.map((item) => (
                <div key={`${item.medication_id}-${item.scheduled_time}`} className="flex flex-wrap items-start justify-between gap-2 text-xs">
                  <div>
                    <p className="font-medium text-foreground">
                      {item.scheduled_time} · {item.name} {item.dosage}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">{item.action}</p>
                  </div>
                  <Badge variant={item.status === "missed" ? "destructive" : item.status === "taken" ? "secondary" : "outline"}>{item.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {meds.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Dori bo'yicha pattern</p>
            {meds.map((item) => (
              <p key={item.medication_id} className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{item.name}:</span> {item.rate ?? "data yo'q"}% · missed {item.missed}/{item.due}. {item.advice}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AdherenceLogActionsCard({
  actions,
}: {
  actions: NonNullable<ChatMessage["adherence_log_actions"]>
}) {
  const anyLate = actions.some((action) => action.status === "late")
  const anyMissed = actions.some((action) => action.status === "missed")

  return (
    <div
      className={cn(
        "mt-3 rounded-2xl border p-3 text-xs shadow-sm",
        anyMissed ? "border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10" : anyLate ? "border-amber-300/50 bg-amber-50/70" : "border-primary/20 bg-primary/5",
      )}
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 className={cn("mt-0.5 size-4 shrink-0", anyMissed ? "text-[var(--risk-high)]" : anyLate ? "text-amber-700" : "text-primary")} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{anyMissed ? `${actions.length} ta doza missed deb belgilandi` : `${actions.length} ta doza chat orqali belgilandi`}</p>
            <Badge variant={anyMissed ? "destructive" : anyLate ? "outline" : "secondary"} className="rounded-full text-[10px]">
              {anyMissed ? "missed" : anyLate ? "late bor" : "taken"}
            </Badge>
          </div>
          <div className="mt-2 space-y-1.5">
            {actions.slice(0, 5).map((action) => (
              <div key={action.log_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/70 px-2 py-1.5">
                <span className="text-muted-foreground">
                  {action.scheduled_time} · {action.medication_name} {action.dosage}
                </span>
                <Badge variant={action.status === "missed" ? "destructive" : action.status === "late" ? "outline" : "secondary"} className="text-[10px]">
                  {action.status}
                </Badge>
              </div>
            ))}
          </div>
          {anyMissed && (
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Keyingi dozani o'zingizcha ikki baravar qilmang; retseptdagi rejaga qayting va sabab takrorlansa shifokorga yozing.
            </p>
          )}
          {anyLate && (
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Ayrim doza kech belgilandi. Keyingi dozani o'zingizcha ikki baravar qilmang.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function AdherenceLogActionCard({
  action,
}: {
  action: NonNullable<ChatMessage["adherence_log_action"]>
}) {
  const late = action.status === "late"
  const missed = action.status === "missed"

  return (
    <div
      className={cn(
        "mt-3 rounded-2xl border p-3 text-xs shadow-sm",
        missed ? "border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10" : late ? "border-amber-300/50 bg-amber-50/70" : "border-primary/20 bg-primary/5",
      )}
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 className={cn("mt-0.5 size-4 shrink-0", missed ? "text-[var(--risk-high)]" : late ? "text-amber-700" : "text-primary")} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{missed ? "Doza missed deb belgilandi" : "Doza chat orqali belgilandi"}</p>
            <Badge variant={missed ? "destructive" : late ? "outline" : "secondary"} className="rounded-full text-[10px]">
              {action.status}
            </Badge>
          </div>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            {action.scheduled_time} · {action.medication_name} {action.dosage}
          </p>
          {action.delay_minutes > 15 && (
            <p className="mt-1 leading-relaxed text-muted-foreground">
              Kechikish: {action.delay_minutes} daqiqa. Keyingi dozani o'zingizcha ikki baravar qilmang.
            </p>
          )}
          {missed && (
            <p className="mt-1 leading-relaxed text-muted-foreground">
              Keyingi dozani o'zingizcha ikki baravar qilmang; retseptdagi rejaga qayting.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatImageAnalysisCard({
  analysis,
  onApplySuggestion,
}: {
  analysis: ChatImageReply
  onApplySuggestion: (suggestion: PrescriptionMedicationSuggestion) => void
}) {
  const cards = analysis.medication_cards.slice(0, 3)
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm">
      <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <ImagePlus className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Rasm orqali dori tahlili</p>
            <Badge variant={analysis.risk_flag ? "destructive" : "secondary"} className="rounded-full text-[11px]">
              {cards.length} dori
            </Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{analysis.prescription.summary}</p>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        {cards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
            Dori nomi aniq topilmadi. Quti nomi, faol modda yoki retsept qismi ko'rinadigan rasm yuboring.
          </p>
        ) : (
          cards.map((card, index) => {
            const ingredients = card.drug_knowledge.ingredients.map((item) => item.name).filter(Boolean).join(", ")
            const safety = card.medication_safety
            return (
              <div key={`${card.suggestion.name}-${index}`} className="rounded-xl border border-border/60 bg-background/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {card.suggestion.name || "Noma'lum dori"} {card.suggestion.dosage ? `· ${card.suggestion.dosage}` : ""}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Faol modda: {ingredients || "aniqlashtirish kerak"}
                    </p>
                  </div>
                  <Badge variant={safety?.review_required ? "destructive" : "outline"} className="rounded-full text-[11px]">
                    {safety?.recommendation_level || card.suggestion.confidence + "%"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {card.drug_knowledge.daily_dose_review.message || card.drug_knowledge.dose_review.message}
                </p>
                <DoseEstimateBadges knowledge={card.drug_knowledge} className="mt-2" />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {card.drug_knowledge.official_sources.slice(0, 2).map((source) => (
                    <OfficialSourceLink key={`${source.name}-${source.status}`} source={source} />
                  ))}
                </div>
                {safety?.potential_interactions?.[0] && (
                  <p className="mt-2 rounded-lg border border-[var(--risk-high)]/25 bg-[var(--risk-high)]/10 px-2 py-1.5 text-xs leading-relaxed text-muted-foreground">
                    {safety.potential_interactions[0].issue}
                  </p>
                )}
                {(card.suggestion.name || card.suggestion.dosage) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3 rounded-full bg-background"
                    onClick={() => onApplySuggestion(card.suggestion)}
                  >
                    Formaga qo'llash
                  </Button>
                )}
              </div>
            )
          })
        )}
        {analysis.prescription.warnings.slice(0, 2).map((warning) => (
          <p key={warning} className="rounded-xl border border-amber-300/50 bg-amber-50/70 px-3 py-2 text-xs text-amber-800">
            {warning}
          </p>
        ))}
      </div>
    </div>
  )
}

function OfficialSourceLink({
  source,
}: {
  source: NonNullable<NonNullable<ChatMessage["drug_knowledge"]>["official_sources"]>[number]
}) {
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex">
      <Badge variant={source.status === "found" ? "secondary" : "outline"} className="gap-1 text-[10px]">
        {source.name}: {source.status}
        <ExternalLink className="size-3" />
      </Badge>
    </a>
  )
}

function DoseEstimateBadges({
  knowledge,
  className,
}: {
  knowledge: NonNullable<ChatMessage["drug_knowledge"]>
  className?: string
}) {
  const singleDose = knowledge.dose_review.estimated_single_dose_amount_mg
  const dailyDose = knowledge.daily_dose_review.estimated_daily_amount_mg
  if (singleDose == null && dailyDose == null) return null

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {singleDose != null && (
        <Badge variant="outline" className="rounded-full bg-background/70 text-[10px]">
          1 qabul: {formatMg(singleDose)}
        </Badge>
      )}
      {knowledge.dose_review.dose_count != null && (
        <Badge variant="outline" className="rounded-full bg-background/70 text-[10px]">
          Soni: {Number(knowledge.dose_review.dose_count.toFixed(2)).toLocaleString("uz-UZ")} dona
        </Badge>
      )}
      {dailyDose != null && (
        <Badge variant={knowledge.daily_dose_review.level === "caution" ? "destructive" : "secondary"} className="rounded-full text-[10px]">
          Kuniga: {formatMg(dailyDose)}
        </Badge>
      )}
    </div>
  )
}

function formatMg(value: number) {
  return `${Number(value.toFixed(4)).toLocaleString("uz-UZ")}mg`
}

function DrugKnowledgeCard({
  knowledge,
}: {
  knowledge: NonNullable<ChatMessage["drug_knowledge"]>
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm">
      <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Pill className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Dori knowledge-card</p>
            {knowledge.rxcui ? (
              <Badge variant="outline" className="rounded-full bg-background/60 text-[11px]">
                RxCUI: {knowledge.rxcui}
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full bg-background/60 text-[11px]">
                Aniqlashtirish kerak
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{knowledge.patient_summary}</p>
          {knowledge.official_sources && knowledge.official_sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {knowledge.official_sources.slice(0, 2).map((source) => (
                <OfficialSourceLink key={`${source.name}-${source.status}`} source={source} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        {knowledge.ingredients.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Faol modda</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {knowledge.ingredients.map((item) => item.name).filter(Boolean).join(", ")}
            </p>
          </div>
        )}
        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Doza formati</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{knowledge.dose_review.message}</p>
          <DoseEstimateBadges knowledge={knowledge} className="mt-2" />
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Kunlik doza: {knowledge.daily_dose_review.message}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Qanday ichish</p>
            <Badge variant="outline">{knowledge.administration_review.meal_timing}</Badge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{knowledge.administration_review.timing_message}</p>
          {knowledge.administration_review.timing_suggestions.slice(0, 2).map((item) => (
            <p key={item} className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {item}
            </p>
          ))}
        </div>
        {knowledge.label_evidence.found && (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">FDA label evidence</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {knowledge.label_evidence.has_active_ingredient && <Badge variant="outline">active ingredient</Badge>}
              {knowledge.label_evidence.has_dosage_and_administration && <Badge variant="outline">dosage</Badge>}
              {knowledge.label_evidence.has_drug_interactions && <Badge variant="outline">interactions</Badge>}
              {knowledge.label_evidence.has_contraindications && <Badge variant="outline">contraindications</Badge>}
              {knowledge.label_evidence.has_warnings && <Badge variant="outline">warnings</Badge>}
              {knowledge.label_evidence.has_boxed_warning && <Badge variant="destructive">boxed warning</Badge>}
            </div>
            {knowledge.label_evidence.snippets.slice(0, 2).map((snippet) => (
              <p key={snippet.section} className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{snippet.section}:</span> {snippet.text}
              </p>
            ))}
          </div>
        )}
        {knowledge.warnings.length > 0 && (
          <div className="rounded-xl border border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Diqqat</p>
            <ul className="mt-2 space-y-1">
              {knowledge.warnings.slice(0, 2).map((warning) => (
                <li key={warning} className="text-xs leading-relaxed text-muted-foreground">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Manba: {knowledge.source}. {knowledge.disclaimer}
        </p>
      </div>
    </div>
  )
}

function MedicationIntelligenceCard({
  intelligence,
}: {
  intelligence: NonNullable<ChatMessage["medication_intelligence"]>
}) {
  const flags = intelligence.potential_interactions.slice(0, 2)
  const timing = intelligence.timing_suggestions.slice(0, 2)
  const questions = intelligence.questions_for_doctor.slice(0, 2)
  const normalized = (intelligence.normalized_medications ?? []).filter((item) => item.rxnorm_name).slice(0, 3)
  const patterns = (intelligence.adherence_patterns ?? []).filter((pattern) => pattern.problem_level !== "low").slice(0, 2)
  const scheduleBlocks = (intelligence.schedule_advisor?.time_blocks ?? []).filter((block) => block.level !== "ok").slice(0, 2)
  const timingGapRules = (intelligence.schedule_advisor?.timing_gap_rules ?? []).slice(0, 2)
  const contextFlags = (intelligence.contraindication_flags ?? []).slice(0, 2)
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm">
      <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Pill className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Dori jadvali tahlili</p>
            <Badge variant="outline" className="rounded-full bg-background/60 text-[11px]">
              {intelligence.medications_reviewed} dori · {intelligence.schedule_complexity.daily_doses} doza/kun
            </Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{intelligence.patient_message}</p>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        {flags.length > 0 && (
          <div className="rounded-xl border border-[var(--risk-high)]/30 bg-[var(--risk-high)]/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Tekshirish kerak</p>
            <ul className="mt-2 space-y-2">
              {flags.map((flag, index) => (
                <li key={`${flag.medications.join("-")}-${index}`} className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{flag.medications.join(" + ")}:</span> {flag.issue}
                </li>
              ))}
            </ul>
          </div>
        )}
        {timing.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Vaqt oralig'i</p>
            <ul className="mt-2 space-y-2">
              {timing.map((item) => (
                <li key={item} className="text-xs leading-relaxed text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {patterns.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Qaysi dori e'tibor talab qilyapti</p>
            <div className="mt-2 space-y-2">
              {patterns.map((pattern) => (
                <div key={pattern.medication_id} className="rounded-lg bg-background/70 px-3 py-2 text-xs leading-relaxed">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{pattern.medication_name}</span>
                    <Badge variant={pattern.problem_level === "high" ? "destructive" : "outline"} className="rounded-full text-[10px]">
                      {pattern.adherence_rate === null ? "data yo'q" : `${Math.round(pattern.adherence_rate)}%`}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Missed: {pattern.missed} · Late: {pattern.late}. {pattern.action_hint}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {scheduleBlocks.length > 0 && (
          <div className="rounded-xl border border-[var(--risk-high)]/25 bg-[var(--risk-high)]/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Vaqt/oraliq signali</p>
            <div className="mt-2 space-y-2">
              {scheduleBlocks.map((block) => (
                <div key={block.time} className="rounded-lg bg-background/70 px-3 py-2 text-xs leading-relaxed">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{block.time} bloki</span>
                    <Badge variant={block.level === "caution" ? "destructive" : "outline"} className="rounded-full text-[10px]">
                      {block.level === "caution" ? "interval" : "review"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {block.medications.map((medication) => medication.name).join(", ")}
                  </p>
                  {block.issues[0] && <p className="mt-1 text-muted-foreground">{block.issues[0]}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        {timingGapRules.length > 0 && (
          <div className="rounded-xl border border-[var(--risk-high)]/25 bg-[var(--risk-high)]/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Aniq interval risk</p>
            <div className="mt-2 space-y-2">
              {timingGapRules.map((rule) => (
                <div key={`${rule.medications.join("-")}-${rule.suggested_gap_minutes}`} className="rounded-lg bg-background/70 px-3 py-2 text-xs leading-relaxed">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{rule.medications.join(" + ")}</span>
                    <Badge variant={rule.severity === "caution" ? "destructive" : "outline"} className="rounded-full text-[10px]">
                      {rule.suggested_gap_minutes} min
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{rule.issue}</p>
                  <p className="mt-1 text-muted-foreground">{rule.patient_action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {contextFlags.length > 0 && (
          <div className="rounded-xl border border-amber-300/50 bg-amber-50/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Bemor konteksti safety</p>
            <div className="mt-2 space-y-2">
              {contextFlags.map((flag) => (
                <div key={`${flag.medication_id}-${flag.issue}`} className="rounded-lg bg-background/70 px-3 py-2 text-xs leading-relaxed">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{flag.medication_name}</span>
                    <Badge variant={flag.severity === "caution" ? "destructive" : "outline"} className="rounded-full text-[10px]">
                      {flag.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{flag.issue}</p>
                  <p className="mt-1 text-muted-foreground">{flag.patient_action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {normalized.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">RxNorm reconciliation</p>
            <ul className="mt-2 space-y-2">
              {normalized.map((item) => (
                <li key={`${item.id}-${item.name}`} className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{item.name}:</span> {item.rxnorm_name}
                  {item.ingredients.length > 0 ? ` · ${item.ingredients.map((ingredient) => ingredient.name).filter(Boolean).join(", ")}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        {questions.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Shifokorga savol</p>
            <ul className="mt-2 space-y-2">
              {questions.map((question) => (
                <li key={question} className="text-xs leading-relaxed text-muted-foreground">
                  {question}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-[11px] leading-relaxed text-muted-foreground">{intelligence.disclaimer}</p>
      </div>
    </div>
  )
}

function CandidateMedicationSafetyCard({
  review,
}: {
  review: NonNullable<ChatMessage["candidate_medication_safety"]>
}) {
  const level = review.recommendation_level
  const risky = level === "urgent" || level === "caution"
  const flags = review.potential_interactions.slice(0, 2)
  const contextFlags = (review.contraindication_flags ?? []).slice(0, 2)
  const patientContextFlags = (review.patient_context_flags ?? []).slice(0, 2)
  const patientContextInteractions = (review.patient_context_interactions ?? []).slice(0, 2)
  const timing = review.timing_suggestions.slice(0, 2)
  const timingGapRules = (review.schedule_advisor?.timing_gap_rules ?? []).slice(0, 2)
  const questions = review.questions_for_doctor.slice(0, 3)
  const knowledge = review.drug_knowledge
  const ingredients = knowledge?.ingredients.map((item) => item.name).filter(Boolean).join(", ")
  return (
    <div className={cn("mt-3 overflow-hidden rounded-2xl border shadow-sm", risky ? "border-[var(--risk-high)]/35 bg-[var(--risk-high)]/10" : "border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card")}>
      <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", risky ? "bg-[var(--risk-high)] text-white" : "bg-primary text-primary-foreground")}>
          <Pill className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Yangi dori safety check</p>
            <Badge variant={risky ? "destructive" : review.review_required ? "outline" : "secondary"} className="rounded-full text-[11px]">
              {level}
            </Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {review.candidate.name} {review.candidate.dosage ? `· ${review.candidate.dosage}` : ""}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{review.patient_message}</p>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        {knowledge && (
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Rasmiy dori ma'lumoti</p>
              {knowledge.rxcui && <Badge variant="secondary">RxCUI: {knowledge.rxcui}</Badge>}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Faol modda: {ingredients || "aniqlashtirish kerak"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Kunlik doza: {knowledge.daily_dose_review.message}
            </p>
            <DoseEstimateBadges knowledge={knowledge} className="mt-2" />
            {(knowledge.official_sources ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(knowledge.official_sources ?? []).slice(0, 2).map((source) => (
                  <OfficialSourceLink key={`${source.name}-${source.status}`} source={source} />
                ))}
              </div>
            )}
          </div>
        )}
        {flags.length > 0 && (
          <div className="rounded-xl border border-[var(--risk-high)]/30 bg-background/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Interaction signali</p>
            {flags.map((flag, index) => (
              <div key={`${flag.medications.join("-")}-${index}`} className="mt-2 rounded-lg bg-background/80 px-3 py-2">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{flag.medications.join(" + ")}:</span> {flag.issue}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{flag.patient_action}</p>
              </div>
            ))}
          </div>
        )}
        {contextFlags.length > 0 && (
          <div className="rounded-xl border border-amber-300/50 bg-background/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Yangi dori bilan bog'liq kontekst</p>
            {contextFlags.map((flag) => (
              <div key={`${flag.medication_id}-${flag.issue}`} className="mt-2 rounded-lg bg-background/80 px-3 py-2">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{flag.related_medications.join(" + ")}:</span> {flag.issue}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{flag.patient_action}</p>
              </div>
            ))}
          </div>
        )}
        {(patientContextFlags.length > 0 || patientContextInteractions.length > 0) && (
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bemorning alohida mavjud signal'lari</p>
            {patientContextFlags.map((flag) => (
              <p key={`${flag.medication_id}-${flag.issue}`} className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{flag.medication_name}:</span> {flag.issue}
              </p>
            ))}
            {patientContextInteractions.map((flag, index) => (
              <p key={`${flag.medications.join("-")}-${index}`} className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{flag.medications.join(" + ")}:</span> {flag.issue}
              </p>
            ))}
          </div>
        )}
        {timing.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Vaqt/doza bo'yicha</p>
            {timing.map((item) => (
              <p key={item} className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {item}
              </p>
            ))}
          </div>
        )}
        {timingGapRules.length > 0 && (
          <div className="rounded-xl border border-[var(--risk-high)]/25 bg-background/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Aniq interval risk</p>
            {timingGapRules.map((rule) => (
              <div key={`${rule.medications.join("-")}-${rule.suggested_gap_minutes}`} className="mt-2 rounded-lg bg-background/80 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{rule.medications.join(" + ")}</span>
                  <Badge variant={rule.severity === "caution" ? "destructive" : "outline"} className="rounded-full text-[10px]">
                    {rule.suggested_gap_minutes} min
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{rule.issue}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{rule.patient_action}</p>
              </div>
            ))}
          </div>
        )}
        {questions.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Shifokor/farmatsevtga savol</p>
            {questions.map((question) => (
              <p key={question} className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {question}
              </p>
            ))}
          </div>
        )}
        <p className="text-[11px] leading-relaxed text-muted-foreground">{review.disclaimer}</p>
      </div>
    </div>
  )
}

function EvidenceCardsPanel({ cards }: { cards: NonNullable<ChatMessage["evidence_cards"]> }) {
  const [open, setOpen] = useState(false)
  if (!cards.length) return null
  const confidenceColor = (c: number) => (c >= 0.8 ? "text-green-600" : c >= 0.5 ? "text-yellow-600" : "text-red-500")
  const sourceLabel: Record<string, string> = { rxnorm: "RxNorm", openfda: "openFDA", local_rules: "Safety Rules", clinical_profile: "Clinical Profile", who: "WHO" }
  return (
    <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-blue-700 dark:text-blue-300"
      >
        <BrainCircuit className="h-3.5 w-3.5" />
        <span>Dalillar / Источники ({cards.length})</span>
        <span className="ml-auto text-[10px]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          {cards.map((card, i) => (
            <div key={i} className="rounded-lg border bg-card p-2 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{sourceLabel[card.source] || card.source}</Badge>
                <span className="font-medium">{card.title}</span>
                <span className={cn("ml-auto text-[10px] font-semibold", confidenceColor(card.confidence))}>
                  {Math.round(card.confidence * 100)}%
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">{card.snippet}</p>
              {card.url && (
                <a href={card.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-blue-600 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Manba
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RescuePlanCard({ plan }: { plan: NonNullable<ChatMessage["rescue_plan"]> }) {
  const escalation = escalationLabel(plan.escalation)
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm">
      <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <BrainCircuit className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{plan.title}</p>
            <Badge variant="outline" className="rounded-full bg-background/60 text-[11px]">
              {Math.round(plan.confidence)}% signal
            </Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{plan.why_it_matters}</p>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">3 ta mikro-qadam</p>
          <ul className="mt-2 space-y-2">
            {plan.micro_steps.slice(0, 3).map((step, index) => (
              <li key={index} className="flex gap-2 text-xs leading-relaxed text-foreground">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Users className="size-3.5 text-primary" />
              Family task
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{plan.family_task}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Stethoscope className="size-3.5 text-primary" />
              Care-team signal
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{plan.doctor_note}</p>
          </div>
        </div>
        <Badge variant={escalation.variant} className="rounded-full">
          {escalation.label}
        </Badge>
      </div>
    </div>
  )
}

function escalationLabel(escalation: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (escalation === "emergency") return { label: "Darhol yordam kerak", variant: "destructive" }
  if (escalation === "doctor") return { label: "Shifokor follow-up kerak", variant: "default" }
  if (escalation === "family") return { label: "Oilaviy nudge yetarli", variant: "secondary" }
  return { label: "Kuzatish rejimi", variant: "outline" }
}

function EscalationStatusCard({ escalation }: { escalation: NonNullable<ChatMessage["escalation"]> }) {
  const urgent = escalation.severity === "urgent" || escalation.severity === "critical"
  return (
    <div className={cn("mt-3 rounded-2xl border p-3 text-xs shadow-sm", urgent ? "border-[var(--risk-critical)]/35 bg-[var(--risk-critical)]/5" : "border-primary/20 bg-primary/5")}>
      <div className="flex items-start gap-2">
        <AlertCircle className={cn("mt-0.5 size-4 shrink-0", urgent ? "text-[var(--risk-critical)]" : "text-primary")} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">Care-team signal yaratildi</p>
            <Badge variant={urgent ? "destructive" : "outline"} className="rounded-full text-[10px]">
              {escalation.severity}
            </Badge>
          </div>
          <p className="mt-1 leading-relaxed text-muted-foreground">{escalation.message}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-1">
              <Stethoscope className="size-3" />
              Doctor: {escalation.doctor_notifications}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-1">
              <Users className="size-3" />
              Family: {escalation.family_notifications}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedbackButtons({ content }: { content: string }) {
  const [sent, setSent] = useState<"up" | "down" | null>(null)

  async function submit(rating: "up" | "down") {
    setSent(rating)
    try {
      await api.aiFeedback({ message_content: content, rating })
    } catch {
      // silent — non-critical
    }
  }

  if (sent) {
    return (
      <p className="mt-1 text-[11px] text-muted-foreground">
        {sent === "up" ? "👍 Rahmat!" : "👎 Tushundim, yaxshilaymiz"}
      </p>
    )
  }

  return (
    <div className="mt-1 flex gap-1">
      <button type="button" onClick={() => submit("up")} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Thumbs up">
        <ThumbsUp className="size-3.5" />
      </button>
      <button type="button" onClick={() => submit("down")} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Thumbs down">
        <ThumbsDown className="size-3.5" />
      </button>
    </div>
  )
}

function TypingBubble() {
  return (
    <li className="flex justify-start gap-2">
      <Avatar className="size-8">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="rounded-2xl rounded-bl-md border border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="typing-dot inline-block size-1.5 rounded-full bg-muted-foreground" />
          <span className="typing-dot inline-block size-1.5 rounded-full bg-muted-foreground" />
          <span className="typing-dot inline-block size-1.5 rounded-full bg-muted-foreground" />
        </div>
      </div>
    </li>
  )
}

function CrisisCard() {
  const { t } = useI18n()
  return (
    <div className="mt-3 rounded-2xl border-2 border-[var(--risk-critical)]/40 bg-[var(--risk-critical)]/5 p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="size-4 shrink-0 text-[var(--risk-critical)]" />
        <p className="text-xs font-semibold text-foreground">{t("chat.crisisTitle")}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline" className="h-8 rounded-full text-xs">
          <a href="tel:1003">{t("chat.crisisHotline")}</a>
        </Button>
        <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs">
          <Stethoscope className="mr-1 size-3.5" />
          {t("chat.crisisFamily")}
        </Button>
      </div>
    </div>
  )
}
