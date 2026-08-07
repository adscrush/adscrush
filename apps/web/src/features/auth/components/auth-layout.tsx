"use client"

import { Button } from "@adscrush/ui/components/button"
import { ChevronLeftIcon, Sparkles } from "lucide-react"
import Link from "next/link"
import { FloatingPaths } from "./floating-paths"
import { useMemo } from "react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description: string
}

type Star = {
  left: string
  top: string
  size: number
  opacity: number
}

const generateStars = (count: number) =>
  Array.from(
    { length: count },
    (_, index) =>
      ({
        left: `${(index * 41) % 100}%`,
        top: `${(index * 67) % 100}%`,
        size: index % 3 === 0 ? 1 : 2,
        opacity: 0.2 + ((index * 11) % 8) / 10,
      }) satisfies Star
  )

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  const stars = useMemo(() => generateStars(40), [])

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="gradient-card inset-glow relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        {stars.map((star, i) => (
          <span
            key={`auth-star-${i}`}
            className="star-dot"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity * 0.7,
            }}
          />
        ))}
        {/* <img
          src="https://images.pexels.com/photos/6261366/pexels-photo-6261366.jpeg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        /> */}
        {/* <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" /> */}

        <img src="/logo.png" alt="" className="relative z-99 mr-auto h-10" />

        <div className="relative z-10 max-w-xl pt-4">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border/20 bg-card/70 px-3 py-2 text-xs text-foreground/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            New Update · Introducing v3
            <span className="underline underline-offset-2">Try Now</span>
          </div>
          <h1 className="mt-8 text-3xl leading-[1.1] font-medium text-balance xl:text-4xl">
            Keep attribution, monitoring, and reporting in one operator workspace
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground/65">
            Sign in to Adscrush and get back to click tracking, conversion visibility, payout monitoring, and day-to-day
            performance operations.
          </p>
        </div>

        <div className="inset-glow relative z-10 -mx-8 mt-auto -mb-8 rounded-t-3xl border border-border/10 bg-card/35 p-6 pb-10 backdrop-blur">
          <div className="mb-4 flex items-center justify-between border-b border-border/10 pb-3">
            <p className="text-xs text-foreground/60">Dashboard · Assets Overview</p>
            <span className="rounded-md border border-border/10 bg-foreground/10 px-2 py-1 text-[10px] text-foreground/70">
              Live
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/10 bg-card/60 p-3">
              <p className="text-[11px] text-foreground/55">Stripe</p>
              <p className="mt-1 text-xl font-semibold">$9,352,102</p>
              <p className="mt-1 text-[11px] text-foreground/60">+20% this month</p>
            </div>
            <div className="rounded-xl border border-border/10 bg-card/60 p-3">
              <p className="text-[11px] text-foreground/55">PayPal</p>
              <p className="mt-1 text-xl font-semibold">$4,118,062</p>
              <p className="mt-1 text-[11px] text-foreground/60">-4% this week</p>
            </div>
            <div className="rounded-xl border border-border/10 bg-card/60 p-3">
              <p className="text-[11px] text-foreground/55">Alerts</p>
              <p className="mt-1 text-xl font-semibold">18 pending</p>
              <p className="mt-1 text-[11px] text-foreground/60">3 need review</p>
            </div>
          </div>
        </div>

        {/* <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              &ldquo;This Platform has helped me to save time and serve my
              clients faster than ever before.&rdquo;
            </p>
            <footer className="font-mono text-sm font-semibold">
              ~ Ali Hassan
            </footer>
          </blockquote>
        </div> */}
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>
      <div className="relative flex min-h-screen flex-col justify-center p-4">
        <div aria-hidden className="absolute inset-0 isolate -z-10 opacity-60 contain-strict">
          <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>
        <Button asChild className="absolute top-7 left-5" variant="ghost">
          <Link href="/">
            <ChevronLeftIcon />
            Home
          </Link>
        </Button>
        <div className="mx-auto space-y-4 sm:w-sm">
          <img src="/logo.png" alt="" className="h-6 lg:hidden" />
          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-bold tracking-wide">{title}</h1>
            <p className="text-base text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
