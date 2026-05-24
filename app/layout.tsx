import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { I18nProvider } from "@/lib/i18n/provider"
import { AuthProvider } from "@/lib/auth/provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "NoSkipAI — Davolanishingizning ishonchli yordamchisi",
  description:
    "NoSkipAI — surunkali kasalliklar bilan davolanayotgan bemorlar uchun aqlli eslatmalar, AI suhbatdosh va oilaviy qo'llab-quvvatlash platformasi.",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NoSkipAI",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uz" className="bg-background" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="overflow-x-clip font-sans antialiased">
        <I18nProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </I18nProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.getRegistrations()
                    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
                    .catch(() => {});
                  if ('caches' in window) {
                    caches.keys()
                      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('noskipai-')).map((key) => caches.delete(key))))
                      .catch(() => {});
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
