import { Heart } from "lucide-react"
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
          "relative grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm",
          "ring-1 ring-primary/20 transition-transform group-hover:scale-105",
          dims,
        )}
        aria-hidden
      >
        <Heart className="size-4 fill-current" strokeWidth={0} />
      </span>
      {/* Brand wordmark — hidden on the smallest screens to free horizontal
          space for the language switcher and primary CTA in the nav. */}
      <span className={cn("hidden whitespace-nowrap font-semibold tracking-tight text-foreground sm:inline", text)}>
        AI Hamroh
      </span>
    </Link>
  )
}
