"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@adscrush/ui/components/button"

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

const CTASection = () => {
  const ctaStars = useMemo(() => generateStars(24), [])

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="gradient-card relative overflow-hidden rounded-[35px]">
          {ctaStars.map((star, i) => (
            <span
              key={`cta-star-${i}`}
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
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-[linear-gradient(180deg,hsl(0_0%_0%/0.42)_0%,hsl(0_0%_0%/0.12)_48%,transparent_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-[linear-gradient(180deg,hsl(235_79%_24%/0)_0%,hsl(235_72%_32%/0.82)_60%,hsl(232_58%_72%/0.94)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_100%,hsl(var(--glow)/0.18)_0%,transparent_72%)]" />

          <div className="relative z-10 flex flex-col items-center px-6 py-24 text-center">
            <div
              data-reveal
              className={`${sectionClass} mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,hsl(232_75%_65%/0.95)_0%,hsl(226_64%_55%/0.92)_100%)] shadow-[0_14px_40px_hsl(231_60%_40%/0.45)]`}
            >
              <img src="/logo.png" alt="Adscrush" className="h-12 w-12 object-contain" />
            </div>
            <h2 data-reveal className={`${sectionClass} text-4xl font-medium text-foreground md:text-5xl`}>
              Ready to Start?
            </h2>
            <p data-reveal className={`${sectionClass} mt-4 max-w-2xl text-base leading-8 text-foreground/60`}>
              Bring your team into one clean reporting surface and replace scattered checks with a faster, more reliable
              operating rhythm.
            </p>
            <Button
              asChild
              variant="hero"
              size="xl"
              data-reveal
              className={`${sectionClass} mt-8 min-w-56 transition-transform active:scale-95`}
            >
              <Link href="/auth/sign-up">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection
