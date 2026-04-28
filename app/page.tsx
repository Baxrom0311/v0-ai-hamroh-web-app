import { PublicNav } from "@/components/layout/public-nav"
import { LandingHero } from "@/components/landing/hero"
import { LandingFeatures } from "@/components/landing/features"
import { LandingStats } from "@/components/landing/stats"
import { LandingCta } from "@/components/landing/cta"
import { LandingFooter } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <div className="min-h-svh">
      <PublicNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingStats />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
