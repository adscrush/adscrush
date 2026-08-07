"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import {
  Sparkles,
  Search,
  LayoutDashboard,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  GitBranchPlus,
  BellRing,
  CircleDollarSign,
  ScanSearch,
  Rows3,
  ShieldCheck,
  Layers,
  Gem,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Button } from "@adscrush/ui/components/button"
import { cn } from "@adscrush/ui/lib/utils"
import { stats, tableRows } from "../data"

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
        left: `${(index * 37) % 100}%`,
        top: `${(index * 59) % 100}%`,
        size: index % 3 === 0 ? 1 : 2,
        opacity: 0.2 + ((index * 13) % 8) / 10,
      }) satisfies Star
  )

const sectionClass = "reveal"

const HeroSection = () => {
  const heroStars = useMemo(() => generateStars(60), [])

  return (
    <section id="home" className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8">
      <div className="gradient-card relative overflow-hidden rounded-b-[35px] px-5 pt-24 pb-6 sm:px-8 lg:px-16 lg:pt-28">
        {heroStars.map((star, i) => (
          <span
            key={`hero-star-${i}`}
            className="star-dot"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}

        <div
          data-reveal
          className={`${sectionClass} relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center`}
        >
          <div className="home-glass-surface home-soft-border mb-8 flex items-center gap-3 rounded-[10px] border px-2 py-2">
            <div className="home-card-surface home-soft-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs text-foreground/90">
              <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
              Shipping Faster
            </div>
            <p className="text-xs text-foreground/75">
              Adscrush unifies tracking, attribution, and performance ops in one workspace.
            </p>
          </div>

          <h1 className="mx-auto max-w-[980px] text-4xl leading-tight font-medium text-balance md:text-6xl">
            Track clicks, conversions,
            <br className="hidden md:block" />
            <span className="md:hidden"> </span>
            and revenue without losing the full picture
          </h1>
          <p className="mt-5 max-w-[541px] text-sm text-foreground/70 md:text-base">
            Adscrush gives affiliate teams and performance operators a clear view of attribution, offer health, partner
            quality, and campaign performance from one dark, focused dashboard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" size="xl">
              <Link href="/auth/sign-up">Start with Adscrush</Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link href="#pricing">See plans</Link>
            </Button>
          </div>
        </div>

        <div data-reveal className={`${sectionClass} relative z-10 mt-10 w-full overflow-visible lg:mt-14`}>
          <div className="relative mx-auto h-20 w-full max-w-[1200px] overflow-visible sm:h-24">
            {heroStars.slice(0, 30).map((star, i) => (
              <span
                key={`hero-stage-star-${i}`}
                className="star-dot z-10"
                style={{
                  left: star.left,
                  top: `${Math.min(parseFloat(star.top), 52)}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity * 0.8,
                }}
              />
            ))}
          </div>

          <div className="relative -mt-16 mb-[-100px] w-full lg:-mt-16">
            <div className="mx-auto max-w-[1240px] [perspective:1200px]">
              <div className="origin-top scale-[0.87] [transform:rotateX(10deg)] lg:scale-[0.9]">
                <div className="relative skew-x-[0.2rad]">
                  <div className="relative mx-auto mt-8 w-full max-w-[1300px] overflow-hidden rounded-t-2xl border border-white/10 bg-[#010205] shadow-[inset_0_0_120px_rgba(255,255,255,0.04),inset_0_0_60px_rgba(255,255,255,0.03),inset_0_0_30px_rgba(255,255,255,0.02)] md:mt-12">
                    <div className="flex h-[380px] bg-[#010205] sm:h-[430px] md:h-[540px]">
                      <aside className="hidden w-48 flex-col md:flex">
                        <div className="p-3">
                          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-2.5 py-1.5 shadow-[inset_0_0_20px_rgba(255,255,255,0.04)]">
                            <Search className="h-3 w-3 text-white/40" />
                            <span className="text-[10px] text-white/40">Search</span>
                          </div>
                        </div>

                        <div className="p-3">
                          <span className="mb-2 block text-[9px] tracking-wider text-white/40 uppercase">General</span>
                          <div className="flex flex-col gap-0.5">
                            {(
                              [
                                [LayoutDashboard, "Dashboard"],
                                [BriefcaseBusiness, "Offers"],
                                [ChartNoAxesCombined, "Performance"],
                                [GitBranchPlus, "Partners"],
                                [CircleDollarSign, "Payouts"],
                                [ScanSearch, "Attribution"],
                                [BellRing, "Alerts"],
                                [Rows3, "Reports"],
                                [ShieldCheck, "Monitoring"],
                              ] as const
                            ).map(([Icon, label], index) => (
                              <div
                                key={label}
                                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] transition-colors ${index === 0 ? "border border-white/[0.06] bg-white/[0.04] text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.04)]" : "text-white/50 hover:bg-white/5 hover:text-white/70"}`}
                              >
                                <Icon className="h-3 w-3" />
                                <span>{label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 p-3">
                          <span className="mb-2 block text-[9px] tracking-wider text-white/40 uppercase">
                            Top Features
                          </span>
                          <div className="flex flex-col gap-0.5">
                            {[
                              "Offer visibility",
                              "Postback health",
                              "Revenue tracking",
                              "Partner analytics",
                              "Click quality",
                              "Faster QA",
                              "Alert routing",
                              "Clean exports",
                            ].map((item) => (
                              <div
                                key={item}
                                className="rounded-md px-2 py-1.5 text-[10px] text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </aside>

                      <div className="m-2 flex min-w-0 flex-1 flex-col rounded-xl border border-white/[0.06] shadow-[inset_0_0_40px_rgba(255,255,255,0.06),inset_0_0_20px_rgba(255,255,255,0.04)]">
                        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5 md:px-4">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-white/50">Dashboard</span>
                            <span className="text-white/30">&gt;</span>
                            <span className="text-white">Attribution Overview</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="glass"
                              className="hidden h-8 rounded-lg border-white/10 bg-white/5 px-2.5 text-[10px] text-white/70 hover:bg-white/10 sm:inline-flex"
                            >
                              Invite
                            </Button>
                            <Button variant="hero" className="h-8 rounded-lg px-2.5 text-[10px]">
                              Create report
                            </Button>
                          </div>
                        </div>

                        <div className="px-3 py-3 md:px-4">
                          <h3 className="text-sm font-semibold text-white">Welcome back, team.</h3>
                          <p className="text-[10px] text-white/50">
                            Your clicks, conversions, and payout signals are fresh across the active workspace.
                          </p>
                        </div>

                        <div className="mx-3 mb-6 md:mx-4">
                          <div className="flex w-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm md:flex-row">
                            {stats.map((card, idx) => (
                              <div
                                key={card.name}
                                className={cn(
                                  "flex-1 p-4 md:p-5",
                                  idx !== stats.length - 1 && "border-b border-white/[0.06] md:border-b-0 md:border-r"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                                    {card.label}
                                  </span>
                                  {idx % 4 === 0 ? (
                                    <Layers className="h-3 w-3 text-purple-400/50" />
                                  ) : idx % 4 === 1 ? (
                                    <CircleDollarSign className="h-3 w-3 text-blue-400/50" />
                                  ) : idx % 4 === 2 ? (
                                    <Gem className="h-3 w-3 text-green-400/50" />
                                  ) : (
                                    <Cpu className="h-3 w-3 text-orange-400/50" />
                                  )}
                                </div>
                                <div className="mt-2 flex flex-col gap-0.5">
                                  <h4 className="text-lg font-bold tracking-tight text-white md:text-xl">
                                    {card.value}
                                  </h4>
                                  <div className="flex items-center gap-1.5">
                                    {card.up ? (
                                      <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                      <ArrowDownRight className="h-3 w-3 text-rose-400" />
                                    )}
                                    <span
                                      className={`text-[10px] font-semibold ${card.up ? "text-emerald-400" : "text-rose-400"}`}
                                    >
                                      {card.change}
                                    </span>
                                    <span className="text-[10px] text-white/30">vs Last Month</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="hidden flex-1 sm:block">
                          <div className="mx-3 mb-3 flex flex-1 flex-col md:mx-4">
                            <div className="mb-2 flex items-center justify-between px-1 py-1.5 md:px-0 md:py-2.5">
                              <div className="min-w-[120px] rounded-lg border border-white/[0.06] px-3 py-1.5 shadow-[inset_0_0_20px_rgba(255,255,255,0.04)]">
                                <span className="text-[10px] text-white/40">Search</span>
                              </div>
                              <div className="flex items-center gap-1 text-[9px]">
                                {[
                                  ["Top EPC", true],
                                  ["Newest", false],
                                  ["Needs QA", false],
                                  ["Watchlist", false],
                                ].map(([tab, active]) => (
                                  <span
                                    key={tab as string}
                                    className={`rounded-md px-2 py-1 transition-colors ${active ? "border border-white/[0.06] text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.04)]" : "text-white/50 hover:bg-white/5 hover:text-white/70"}`}
                                  >
                                    {tab as string}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] shadow-[inset_0_0_40px_rgba(255,255,255,0.06),inset_0_0_20px_rgba(255,255,255,0.04)]">
                              <div className="grid grid-cols-6 gap-2 border-b border-white/10 px-4 py-1.5 text-[8px] tracking-wider text-white/40 uppercase">
                                <span>#</span>
                                <span>Product</span>
                                <span>Category</span>
                                <span>Price</span>
                                <span>Change</span>
                                <span>Trend</span>
                              </div>
                              <div className="flex flex-col">
                                {tableRows.map((row) => (
                                  <div
                                    key={row.id}
                                    className="grid grid-cols-6 gap-2 border-b border-white/5 px-4 py-2 text-[10px] transition-colors hover:bg-white/[0.02]"
                                  >
                                    <span className="text-white/40">{row.id}</span>
                                    <span className="text-white">{row.product}</span>
                                    <span className="text-white/50">{row.category}</span>
                                    <span className="text-white">{row.price}</span>
                                    <span className={row.up ? "text-green-500" : "text-red-500"}>{row.change}</span>
                                    <svg className="h-4 w-12" viewBox="0 0 48 16">
                                      <path
                                        d={
                                          row.up
                                            ? "M0 12 L8 10 L16 8 L24 9 L32 6 L40 4 L48 2"
                                            : "M0 4 L8 6 L16 8 L24 7 L32 10 L40 12 L48 14"
                                        }
                                        fill="none"
                                        stroke={row.up ? "#22c55e" : "#ef4444"}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#010205] to-transparent md:h-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
