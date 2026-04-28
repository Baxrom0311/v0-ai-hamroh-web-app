"use client"

import { cn } from "@/lib/utils"
import { riskFromScore } from "@/lib/format"
import type { RiskLevel } from "@/lib/types"

const colorByLevel: Record<RiskLevel, string> = {
  low: "var(--risk-low)",
  medium: "var(--risk-medium)",
  high: "var(--risk-high)",
  critical: "var(--risk-critical)",
}

export function RiskGauge({
  score,
  size = 160,
  thickness = 12,
  label,
}: {
  score: number
  size?: number
  thickness?: number
  label?: string
}) {
  const level = riskFromScore(score)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(score, 100) / 100) * circumference
  const color = colorByLevel[level]

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
      aria-label={label ?? "Risk score"}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

export function RiskBadge({
  level,
  className,
}: {
  level: RiskLevel
  className?: string
}) {
  const color = colorByLevel[level]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`,
        color,
        // @ts-expect-error CSS var
        "--tw-ring-color": `color-mix(in oklab, ${color} 30%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {level}
    </span>
  )
}
