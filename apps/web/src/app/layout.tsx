import { Figtree, Geist, Geist_Mono } from "next/font/google"

import { RevealEffect } from "@/components/common/reveal-effect"
import { ThemeProvider } from "@/components/theme-provider"
import { META_THEME_COLORS } from "@adscrush/shared/config/site"
import { Toaster } from "@adscrush/ui/components/sonner"
import { TooltipProvider } from "@adscrush/ui/components/tooltip"
import "@adscrush/ui/globals.css"
import { cn } from "@adscrush/ui/lib/utils"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { type Metadata, type Viewport } from "next"
import Script from "next/script"
import NextTopLoader from "nextjs-toploader"
import { Suspense } from "react"

import { QueryProvider } from "@/providers/query-provider"
import { ErrorBoundary } from "@/components/error-boundary"

const geistHeading = Geist({ subsets: ["latin"], variable: "--font-heading" })

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
    other: {
      rel: "icon",
      url: "/logo.png",
    },
  },
  title: "AdsCrush - Conversion Tracking & Analytics",
  description:
    "Comprehensive analytics platform for managing leads, clients, products, and advertising campaigns across Google and Meta platforms.",
}

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

// Thanks @shadcn-ui, @tailwindcss
const darkModeScript = String.raw`
  try {
    if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
    }
  } catch (_) {}

  try {
    if (/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) {
      document.documentElement.classList.add('os-macos')
    }
  } catch (_) {}
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtree.variable,
        geistHeading.variable
      )}
    >
      <head>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{ __html: darkModeScript }}
        />
        {/*
          Thanks @tailwindcss. We inject the script via the `<Script/>` tag again,
          since we found the regular `<script>` tag to not execute when rendering a not-found page.
         */}
        <Script src={`data:text/javascript;base64,${btoa(darkModeScript)}`} />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <NuqsAdapter>
              <NextTopLoader color="#2299DD" showSpinner={false} />
              <TooltipProvider>
                <ErrorBoundary>
                  <Suspense fallback={null}>
                    {children}
                    <RevealEffect />
                  </Suspense>
                </ErrorBoundary>
              </TooltipProvider>
              <Toaster richColors position="top-center" />
            </NuqsAdapter>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
