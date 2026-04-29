import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

type LogoProps = {
  href?: string
  size?: "sm" | "md" | "lg"
  className?: string
  /**
   * - "default": icon + wordmark (used in navbars).
   * - "iconOnly": just the cropped brand mark.
   * - "wordmarkOnly": text-only wordmark.
   * - "stacked": large vertical lockup (icon over wordmark) — for hero/marquee.
   */
  variant?: "default" | "iconOnly" | "wordmarkOnly" | "stacked"
}

const LOGO_SRC = "/brand/noskip-ai-logo.png"

/**
 * NoSkip-AI brand mark.
 *
 * The source asset is a vertical lockup PNG (icon stacked over wordmark).
 * For inline navbar use we only want the icon portion, so we render it as a
 * background image inside an aspect-square container with a fixed
 * background-size/position that crops to just the snake-and-chalice mark.
 *
 * The percentage values were derived from the source image: the icon centre
 * sits at roughly (50%, 38.6%) of the full asset, and the icon itself
 * occupies ~62% of the asset's height — so scaling background height to
 * ~162% of the container brings the icon to fill the box.
 */
export function Logo({ href = "/", size = "md", className, variant = "default" }: LogoProps) {
  const dims = size === "sm" ? "size-7" : size === "lg" ? "size-10" : "size-9"
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg"

  if (variant === "stacked") {
    return (
      <Link href={href} className={cn("inline-flex flex-col items-center gap-2", className)}>
        <Image
          src={LOGO_SRC}
          alt="NoSkip-AI"
          width={1535}
          height={1024}
          priority
          className="h-auto w-40 sm:w-48 md:w-56"
        />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn("group flex shrink-0 items-center gap-2 sm:gap-2.5", className)}
      aria-label="NoSkip-AI"
    >
      {variant !== "wordmarkOnly" && (
        <span
          aria-hidden
          className={cn(
            "block rounded-xl bg-white ring-1 ring-primary/15 shadow-sm transition-transform group-hover:scale-105",
            dims,
          )}
          style={{
            backgroundImage: `url(${LOGO_SRC})`,
            backgroundSize: "auto 162%",
            backgroundPosition: "50% 20%",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
      {variant !== "iconOnly" && (
        <span
          className={cn(
            "hidden whitespace-nowrap font-display font-bold tracking-tight text-primary sm:inline",
            text,
          )}
        >
          NoSkip<span className="text-foreground/90">-</span>AI
          <span aria-hidden className="ml-0.5 inline-block size-1.5 translate-y-[-0.6em] rounded-sm bg-destructive align-baseline" />
        </span>
      )}
    </Link>
  )
}

/**
 * Compact inline mark for tiny badges (e.g. an icon next to a 12-14px label).
 * The full PNG asset is too detailed to read at this size, so we use a
 * stylised "R" glyph evoking the wordmark — drawn in the primary navy with
 * a coral coral tongue-mark.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Stylised R: vertical stem, top loop, leg */}
      <path d="M7 4 V 20" />
      <path d="M7 4 H 13.5 a 4 4 0 0 1 0 8 H 7" />
      <path d="M11 12 L 17 20" />
    </svg>
  )
}
