"use client"

import { useState } from "react"
import { Smile, Meh, Frown, BatteryLow, Thermometer } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/provider"

export type Mood = "great" | "ok" | "meh" | "tired" | "sick"

const moods: { id: Mood; icon: React.ComponentType<{ className?: string }>; labelKey: string; color: string }[] = [
  { id: "great", icon: Smile, labelKey: "dashboard.moodGreat", color: "var(--risk-low)" },
  { id: "ok", icon: Smile, labelKey: "dashboard.moodOk", color: "oklch(0.78 0.12 130)" },
  { id: "meh", icon: Meh, labelKey: "dashboard.moodMeh", color: "var(--risk-medium)" },
  { id: "tired", icon: BatteryLow, labelKey: "dashboard.moodTired", color: "var(--risk-high)" },
  { id: "sick", icon: Thermometer, labelKey: "dashboard.moodSick", color: "var(--risk-critical)" },
]

export function MoodSelector({ onSelect }: { onSelect?: (mood: Mood) => void }) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<Mood | null>(null)

  void Frown // keep import for future variants

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {moods.map((m) => {
        const Icon = m.icon
        const active = selected === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setSelected(m.id)
              onSelect?.(m.id)
            }}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-3 text-center transition-all",
              "hover:-translate-y-0.5 hover:shadow-sm",
              active
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/60 bg-card hover:border-primary/40",
            )}
            aria-pressed={active}
          >
            <span
              className="grid size-9 place-items-center rounded-full transition-transform group-hover:scale-110"
              style={{
                backgroundColor: `color-mix(in oklab, ${m.color} 18%, transparent)`,
                color: m.color,
              }}
            >
              <Icon className="size-5" />
            </span>
            <span className="text-[11px] font-medium leading-tight text-foreground sm:text-xs">
              {t(m.labelKey)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
