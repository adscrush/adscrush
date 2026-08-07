"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { Check, Gem } from "lucide-react"
import { Button } from "@adscrush/ui/components/button"
import { pricing } from "../data"

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

const PricingSection = () => {
  const pricingStars = useMemo(() => generateStars(36), [])

  return (
    <section id="pricing" className="relative overflow-hidden px-6 py-24">
      {pricingStars.map((star, i) => (
        <span
          key={`pricing-star-${i}`}
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

      <div className="relative z-10 mx-auto max-w-6xl">
        <h2 data-reveal className={`${sectionClass} text-center text-4xl font-medium md:text-5xl`}>
          Choose the setup that matches <br /> your attribution workflow
        </h2>
        <p data-reveal className={`${sectionClass} mx-auto mt-4 max-w-xl text-center text-foreground/60`}>
          Structured for operators who need dependable tracking visibility now and room to grow into more advanced
          reporting later.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pricing.map((plan, idx) => (
            <article
              key={plan.title}
              data-reveal
              className={`${sectionClass} inset-glow rounded-2xl border p-6 ${
                plan.highlight
                  ? "gradient-card border-[#5d6cff]/20"
                  : "border-white/10 bg-[linear-gradient(180deg,hsl(225_12%_10%/0.96)_0%,hsl(220_10%_7%/0.98)_100%)]"
              }`}
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              {plan.icon && typeof plan.icon === "string" && plan.icon.startsWith("data:") ? (
                <img src={plan.icon} alt={`${plan.title} icon`} className="h-9 w-9 object-contain" loading="lazy" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Gem className="h-5 w-5 text-primary" />
                </div>
              )}
              <h3 className="mt-4 text-lg font-medium text-foreground">{plan.title}</h3>
              <p className="mt-3 text-4xl font-semibold text-foreground">{plan.price}</p>
              <p className="mt-1 text-sm text-foreground/60">{plan.subtitle}</p>

              <div className="mt-5 border-t border-white/8 pt-5" />

              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground/75">
                    <Check className="mt-0.5 h-4 w-4 text-foreground/70" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.highlight ? "hero" : "glass"}
                size="xl"
                className={`mt-6 w-full ${plan.highlight ? "" : "border-white/10 bg-white/8 hover:bg-white/12"}`}
              >
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingSection
