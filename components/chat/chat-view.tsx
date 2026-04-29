"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, ArrowDown, BrainCircuit, CheckCircle2, Mic, Send, Sparkles, Stethoscope, Users } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n/provider"
import { api } from "@/lib/api"
import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ChatView() {
  const { t } = useI18n()
  const [messages, setMessages] = useState<ChatMessage[]>([])
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
        suggested_actions: response.suggested_actions.map((label) => ({ label, action: label })),
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
}: {
  msg: ChatMessage
  prev?: ChatMessage
  onAction: (action: string) => void
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
