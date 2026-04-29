import { Pill } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Logo({
  href = "/",
  className,
  size = "md",
}: {
  href?: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const dims = size === "sm" ? "size-7" : size === "lg" ? "size-10" : "size-9"
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg"
  return (
    <Link href={href} className={cn("group flex shrink-0 items-center gap-2 sm:gap-2.5", className)}>
      <span
        className={cn(
          "relative grid place-items-center rounded-xl bg-gradient-to-br from-primary via-[#1768B2] to-[#7DBDE8] text-primary-foreground shadow-[0_10px_24px_rgba(23,104,178,0.24)]",
          "ring-1 ring-primary/25 transition-transform group-hover:scale-105",
          dims,
        )}
        aria-hidden
      >
        <Pill className="size-4" strokeWidth={2.5} />
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-destructive shadow-[0_0_12px_rgba(232,73,79,0.75)]" />
      </span>
      {/* Brand wordmark — hidden on the smallest screens to free horizontal
          space for the language switcher and primary CTA in the nav. */}
      <span className={cn("hidden whitespace-nowrap font-semibold tracking-tight text-foreground sm:inline", text)}>
        NoSkipAI
      </span>
    </Link>
  )
}
