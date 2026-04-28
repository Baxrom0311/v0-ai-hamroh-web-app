"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowDown,
  Mic,
  Send,
  Sparkles,
  Stethoscope,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n/provider"
import { MOCK_CHAT_HISTORY } from "@/lib/mock-data"
import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

const MOCK_RESPONSES: Record<string, Record<string, ChatMessage>> = {
  side_effect: {
    uz: {
      id: 0,
      role: "assistant",
      content:
        "Yon ta'sirlar haqida eshitib achindim. Iltimos, qaysi yon ta'sirni sezayapsiz? Ko'ngil aynish, bosh og'rig'i, terining sarg'ayishi yoki boshqa narsami? Bu ma'lumot shifokoringizga yuboriladi va men sizga zudlik bilan tavsiya beraman.",
      timestamp: new Date().toISOString(),
      suggested_actions: [
        { label: "Shifokorga aytish", action: "contact_doctor" },
        { label: "Ko'proq bilish", action: "learn_more" },
      ],
    },
    ru: {
      id: 0,
      role: "assistant",
      content:
        "Жаль слышать о побочных эффектах. Какие именно вы заметили — тошнота, головная боль, желтизна кожи или что-то другое? Эта информация будет передана врачу.",
      timestamp: new Date().toISOString(),
      suggested_actions: [
        { label: "Сообщить врачу", action: "contact_doctor" },
        { label: "Узнать больше", action: "learn_more" },
      ],
    },
    en: {
      id: 0,
      role: "assistant",
      content:
        "I'm sorry to hear about the side effects. Which one are you experiencing — nausea, headache, yellowing of skin, or something else? This will be shared with your doctor.",
      timestamp: new Date().toISOString(),
      suggested_actions: [
        { label: "Tell my doctor", action: "contact_doctor" },
        { label: "Learn more", action: "learn_more" },
      ],
    },
  },
  forgot: {
    uz: {
      id: 0,
      role: "assistant",
      content:
        "Hech qisi yo'q, bu hammamiz bilan bo'ladi. Agar 4 soat ichida esladingizmi, hozir iching. Aks holda — keyingi rejaga ko'ra davom eting va dozalarni birlashtirmang. Hozir ichasizmi?",
      timestamp: new Date().toISOString(),
      suggested_actions: [{ label: "Hozir ichdim", action: "log_taken" }],
    },
    ru: {
      id: 0,
      role: "assistant",
      content:
        "Ничего страшного, бывает с каждым. Если прошло меньше 4 часов — примите сейчас. Иначе — пропустите и продолжите по графику. Не удваивайте дозу. Принять сейчас?",
      timestamp: new Date().toISOString(),
      suggested_actions: [{ label: "Принял", action: "log_taken" }],
    },
    en: {
      id: 0,
      role: "assistant",
      content:
        "It's okay — it happens to everyone. If less than 4 hours late, take it now. Otherwise skip and continue on schedule. Don't double up. Took it now?",
      timestamp: new Date().toISOString(),
      suggested_actions: [{ label: "Took it now", action: "log_taken" }],
    },
  },
  feel_bad: {
    uz: {
      id: 0,
      role: "assistant",
      content:
        "Sizni eshitaman, va bu his-tuyg'ular juda muhim. Davolanish — qiyin yo'l, lekin siz yolg'iz emassiz. Oilangiz va shifokoringiz yonimda. Hozir nima haqda gaplashishni xohlaysiz?",
      timestamp: new Date().toISOString(),
      risk_flag: true,
    },
    ru: {
      id: 0,
      role: "assistant",
      content:
        "Я слышу вас, ваши чувства важны. Лечение — непростой путь, но вы не одни. Семья и врач рядом. О чём хотите поговорить?",
      timestamp: new Date().toISOString(),
      risk_flag: true,
    },
    en: {
      id: 0,
      role: "assistant",
      content:
        "I hear you. Your feelings matter. Treatment is a hard road, but you're not alone — your family and doctor are here. What's on your mind?",
      timestamp: new Date().toISOString(),
      risk_flag: true,
    },
  },
  question: {
    uz: {
      id: 0,
      role: "assistant",
      content:
        "Albatta! Qaysi dori haqida bilmoqchisiz? Изониазид yoki Рифампицин-mi? Men yon ta'sirlar, qabul qilish vaqti va saqlash haqida tushuntirib bera olaman.",
      timestamp: new Date().toISOString(),
    },
    ru: {
      id: 0,
      role: "assistant",
      content:
        "Конечно! О каком препарате — Изониазид или Рифампицин? Расскажу о побочных, времени приёма и хранении.",
      timestamp: new Date().toISOString(),
    },
    en: {
      id: 0,
      role: "assistant",
      content: "Sure! Which one — Isoniazid or Rifampicin? I can explain side effects, timing, and storage.",
      timestamp: new Date().toISOString(),
    },
  },
  stop: {
    uz: {
      id: 0,
      role: "assistant",
      content:
        "Sizni tushunaman. Davolanishni to'xtatish katta qaror — keling birga gaplashaylik. Avval — nima sizni shunday his qilishga olib keldi? Yon ta'sirmi, charchoqmi, yoki boshqa narsami? Sizni eshitishga tayyorman.",
      timestamp: new Date().toISOString(),
      risk_flag: true,
      suggested_actions: [{ label: "Shifokor bilan bog'lanish", action: "contact_doctor" }],
    },
    ru: {
      id: 0,
      role: "assistant",
      content:
        "Понимаю. Это серьёзное решение — давайте поговорим. Что вас к этому привело: побочные, усталость или что-то другое? Я слушаю.",
      timestamp: new Date().toISOString(),
      risk_flag: true,
      suggested_actions: [{ label: "Связаться с врачом", action: "contact_doctor" }],
    },
    en: {
      id: 0,
      role: "assistant",
      content:
        "I hear you. Stopping treatment is a big decision — let's talk. What brought you to this — side effects, fatigue, or something else? I'm listening.",
      timestamp: new Date().toISOString(),
      risk_flag: true,
      suggested_actions: [{ label: "Contact my doctor", action: "contact_doctor" }],
    },
  },
  default: {
    uz: {
      id: 0,
      role: "assistant",
      content:
        "Sizni tushundim. Bu haqda ko'proq aytib bera olasizmi? Men sizning his-tuyg'ularingizga e'tibor berishni va aniq yordam taklif qilishni xohlayman.",
      timestamp: new Date().toISOString(),
    },
    ru: {
      id: 0,
      role: "assistant",
      content:
        "Понял. Расскажете подробнее? Хочу учесть ваши чувства и предложить конкретную помощь.",
      timestamp: new Date().toISOString(),
    },
    en: {
      id: 0,
      role: "assistant",
      content:
        "I understand. Could you tell me a bit more? I want to honor your feelings and offer real help.",
      timestamp: new Date().toISOString(),
    },
  },
}

function classify(text: string): keyof typeof MOCK_RESPONSES {
  const t = text.toLowerCase()
  if (/(yon ta'sir|побоч|side effect|nausea|headache)/i.test(t)) return "side_effect"
  if (/(unutdim|забыл|forgot|miss)/i.test(t)) return "forgot"
  if (/(yomon|charcha|tired|болею|плохо|sick|sad|depress|устал)/i.test(t)) return "feel_bad"
  if (/(to'xtat|прекрат|stop|quit)/i.test(t)) return "stop"
  if (/(dori|лекарств|med|drug|preparat)/i.test(t)) return "question"
  return "default"
}

export function ChatView() {
  const { t, locale } = useI18n()
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_HISTORY)
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
    if (!content.trim()) return
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setTyping(true)
    await new Promise((r) => setTimeout(r, 1100 + Math.random() * 600))

    const key = classify(content)
    const tmpl = MOCK_RESPONSES[key][locale] ?? MOCK_RESPONSES[key].uz
    const reply: ChatMessage = { ...tmpl, id: Date.now() + 1, timestamp: new Date().toISOString() }
    setMessages((m) => [...m, reply])
    setTyping(false)
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem-4rem)] w-full max-w-3xl flex-col px-0 sm:px-4 lg:h-[calc(100svh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-card px-4 py-3 sm:rounded-t-3xl sm:border sm:border-border/60 sm:bg-card sm:mt-4">
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

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative flex-1 overflow-y-auto bg-muted/30 px-4 py-5 sm:border-x sm:border-border/60"
      >
        <ul className="space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} msg={msg} prev={messages[i - 1]} onAction={(a) => {
              if (a === "log_taken") {
                send(locale === "uz" ? "Ichdim, rahmat" : locale === "ru" ? "Принял, спасибо" : "Took it, thanks")
              } else {
                send(locale === "uz" ? "Shifokorga aytaman" : locale === "ru" ? "Свяжусь с врачом" : "I'll contact my doctor")
              }
            }} />
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

      {/* Quick replies */}
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

      {/* Input */}
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
          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0 rounded-full"
            disabled={!input.trim() || typing}
            aria-label="Send"
          >
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
  const time = new Date(msg.timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })

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
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border border-border/60 bg-card text-foreground",
          )}
        >
          {msg.content}
        </div>
        {msg.suggested_actions && msg.suggested_actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.suggested_actions.map((a, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                onClick={() => onAction(a.action)}
                className="rounded-full"
              >
                {a.label}
              </Button>
            ))}
          </div>
        )}
        {msg.risk_flag && <CrisisCard />}
        <p className={cn("mt-1 text-[11px] text-muted-foreground", isUser ? "text-right" : "text-left")}>
          {time}
        </p>
      </div>
    </li>
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
