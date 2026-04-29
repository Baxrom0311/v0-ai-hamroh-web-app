import Link from "next/link"
import { cn } from "@/lib/utils"

type LogoProps = {
  href?: string
  size?: "sm" | "md" | "lg"
  className?: string
  variant?: "default" | "wordmarkOnly"
}

/**
 * NoSkip-AI brand mark.
 *
 * Mark: a stylised bowl-of-Hygieia (the pharmacy / medical caduceus symbol —
 * a serpent coiled around a goblet) drawn inline as SVG so it inherits brand
 * colours from CSS tokens. The mark sits in a soft icy-blue square so it
 * reads clearly on both white cards and the page background.
 */
export function Logo({ href = "/", size = "md", className, variant = "default" }: LogoProps) {
  const dims = size === "sm" ? "size-7" : size === "lg" ? "size-10" : "size-9"
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg"

  return (
    <Link href={href} className={cn("group flex shrink-0 items-center gap-2 sm:gap-2.5", className)}>
      <span
        aria-hidden
        className={cn(
          "relative grid place-items-center rounded-xl bg-secondary text-primary",
          "ring-1 ring-primary/15 transition-transform group-hover:scale-105",
          dims,
        )}
      >
        <BrandMark className="h-[68%] w-[68%]" />
      </span>
      {variant !== "wordmarkOnly" && (
        <span
          className={cn(
            "hidden whitespace-nowrap font-display font-bold tracking-tight text-foreground sm:inline",
            text,
          )}
        >
          NoSkip<span className="text-primary">-AI</span>
        </span>
      )}
    </Link>
  )
}

/**
 * Bare SVG mark. Use directly when you don't want the bg square (e.g. inside
 * the hero illustration block). currentColor is the snake/cup stroke.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Bowl */}
      <path d="M5 14 Q 12 22 19 14" />
      <path d="M4.5 14 H 19.5" />
      {/* Stem */}
      <path d="M12 14 V 5" />
      {/* Snake coiled around the stem */}
      <path d="M12 5 Q 8.5 6 9 8 Q 9.5 10 12 10 Q 14.5 10 14 12 Q 13.5 14 10 13.5" />
      {/* Snake head */}
      <circle cx="12" cy="4.6" r="0.9" fill="currentColor" />
    </svg>
  )
}
