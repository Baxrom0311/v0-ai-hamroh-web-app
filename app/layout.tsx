import type { Metadata, Viewport } from "next"
import { Inter, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { I18nProvider } from "@/lib/i18n/provider"
import { AuthProvider } from "@/lib/auth/provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-inter",
  display: "swap",
})

// Poppins is the headline / wordmark face — gives the brand the bold,
// rounded medical-infographic feel referenced in the design brief.
const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata: Metadata = {
  title: "NoSkip-AI — Dori qabulini unutishdan himoya qiluvchi aqlli yordamchi",
  description:
    "NoSkip-AI — surunkali kasalliklar bilan davolanayotgan bemorlar uchun AI eslatmalar, xulq tahlili va oilaviy qo'llab-quvvatlash platformasi.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uz" className={`${inter.variable} ${poppins.variable} bg-background`} suppressHydrationWarning>
      <body className="overflow-x-clip font-sans antialiased">
        <I18nProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </I18nProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
