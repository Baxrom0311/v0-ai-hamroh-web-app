import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { I18nProvider } from "@/lib/i18n/provider"
import { AuthProvider } from "@/lib/auth/provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Hamroh — Davolanishingizning ishonchli yordamchisi",
  description:
    "AI Hamroh — surunkali kasalliklar bilan davolanayotgan bemorlar uchun aqlli eslatmalar, AI suhbatdosh va oilaviy qo'llab-quvvatlash platformasi.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uz" className="bg-background" suppressHydrationWarning>
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
