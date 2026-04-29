"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { DailyAdherence } from "@/lib/types"
export type HeatmapDay = { date: string; total: number; taken: number; missed: number }

function colorForRate(rate: number): string {
  if (rate === 0) return "var(--risk-critical)"
  if (rate < 50) return "var(--risk-high)"
  if (rate < 80) return "var(--risk-medium)"
  if (rate < 100) return "oklch(0.82 0.13 140)"
  return "var(--risk-low)"
}

export function AdherenceHeatmap({ data }: { data: DailyAdherence[] }) {
  const [hover, setHover] = useState<DailyAdherence | null>(null)

  // Group by week (7-day columns starting from earliest)
  const weeks: DailyAdherence[][] = []
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, di) => {
              const day = week[di]
              if (!day) {
                return <div key={di} className="size-5 rounded-md bg-muted/40" />
              }
              const color = colorForRate(day.rate)
              return (
                <button
                  key={di}
                  type="button"
                  className={cn(
                    "size-5 rounded-md ring-1 ring-inset ring-border/50 transition-transform hover:scale-110",
                    hover?.date === day.date && "ring-2 ring-primary",
                  )}
                  style={{
                    backgroundColor: `color-mix(in oklab, ${color} ${30 + day.rate * 0.6}%, transparent)`,
                  }}
                  onMouseEnter={() => setHover(day)}
                  onMouseLeave={() => setHover(null)}
                  aria-label={`${day.date}: ${day.rate}%`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {hover ? `${hover.date} — ${hover.taken}/${hover.scheduled} (${hover.rate}%)` : "\u00A0"}
        </span>
        <div className="flex items-center gap-1.5">
          <span>0%</span>
          {[0, 40, 70, 90, 100].map((r) => (
            <span
              key={r}
              className="size-3 rounded-sm"
              style={{
                backgroundColor: `color-mix(in oklab, ${colorForRate(r)} ${30 + r * 0.6}%, transparent)`,
              }}
            />
          ))}
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}

// Adapter accepting the {date,total,taken,missed} shape used by the
// adherence page mock. Internally maps to AdherenceHeatmap.
export function Heatmap({ data, weeks }: { data: HeatmapDay[]; weeks?: number }) {
  const mapped: DailyAdherence[] = data.map((d) => ({
    date: d.date,
    scheduled: d.total,
    taken: d.taken,
    rate: d.total > 0 ? Math.round((d.taken / d.total) * 100) : 0,
  }))
  const limit = weeks ? weeks * 7 : mapped.length
  return <AdherenceHeatmap data={mapped.slice(-limit)} />
}
