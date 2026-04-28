import type { Locale } from "./i18n/translations"
import type { RiskLevel } from "./types"

const monthsUz = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
]
const weekdaysUz = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"]

const monthsRu = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
]
const weekdaysRu = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
]

export function formatLongDate(date: Date, locale: Locale): string {
  const d = date.getDate()
  const m = date.getMonth()
  const w = date.getDay()
  if (locale === "uz") return `${d}-${monthsUz[m]}, ${weekdaysUz[w]}`
  if (locale === "ru") return `${d} ${monthsRu[m]}, ${weekdaysRu[w]}`
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long", weekday: "long" })
}

export function formatTimeAgo(iso: string, locale: Locale): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) {
    if (locale === "uz") return "hozir"
    if (locale === "ru") return "сейчас"
    return "just now"
  }
  if (mins < 60) {
    if (locale === "uz") return `${mins} daq oldin`
    if (locale === "ru") return `${mins} мин назад`
    return `${mins} min ago`
  }
  const hours = Math.floor(mins / 60)
  if (hours < 24) {
    if (locale === "uz") return `${hours} soat oldin`
    if (locale === "ru") return `${hours} ч назад`
    return `${hours}h ago`
  }
  const days = Math.floor(hours / 24)
  if (locale === "uz") return `${days} kun oldin`
  if (locale === "ru") return `${days} дн назад`
  return `${days}d ago`
}

export function riskFromScore(score: number): RiskLevel {
  if (score <= 30) return "low"
  if (score <= 60) return "medium"
  if (score <= 80) return "high"
  return "critical"
}

export const riskBg: Record<RiskLevel, string> = {
  low: "bg-[var(--risk-low)]",
  medium: "bg-[var(--risk-medium)]",
  high: "bg-[var(--risk-high)]",
  critical: "bg-[var(--risk-critical)]",
}

export const riskText: Record<RiskLevel, string> = {
  low: "text-[var(--risk-low)]",
  medium: "text-[var(--risk-medium)]",
  high: "text-[var(--risk-high)]",
  critical: "text-[var(--risk-critical)]",
}

export const riskBorder: Record<RiskLevel, string> = {
  low: "border-[var(--risk-low)]",
  medium: "border-[var(--risk-medium)]",
  high: "border-[var(--risk-high)]",
  critical: "border-[var(--risk-critical)]",
}

export const riskRing: Record<RiskLevel, string> = {
  low: "ring-[var(--risk-low)]",
  medium: "ring-[var(--risk-medium)]",
  high: "ring-[var(--risk-high)]",
  critical: "ring-[var(--risk-critical)]",
}
