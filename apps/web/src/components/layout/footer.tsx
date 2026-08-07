"use client"

import React from "react"
import Link from "next/link"
import { IconBrandTwitter, IconBrandInstagram, IconBrandFacebook, IconBrandLinkedin } from "@tabler/icons-react"

const Footer = () => {
  const year = typeof window !== "undefined" ? new Date().getFullYear() : 2026
  const productLinks = [
    ["Pricing", "#pricing"],
    ["Platform", "#platform"],
    ["FAQ", "#faq"],
    ["Alerts", "#platform"],
    ["Reporting", "#platform"],
  ] as const

  const companyLinks = [
    ["About", "#home"],
    ["Platform", "#platform"],
    ["Contact", "#contact"],
    ["Sign In", "/auth/sign-in"],
    ["Get Started", "/auth/sign-up"],
  ] as const

  return (
    <footer id="contact" className="mx-auto max-w-6xl border-t border-border/10 px-6 py-12 text-foreground">
      <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <aside className="space-y-4">
          <img src="/logo.png" alt="Adscrush" className="h-10 w-auto object-contain" />
          <p className="text-sm leading-relaxed text-foreground/60">
            Adscrush is built for teams that need reliable attribution, cleaner operations, and faster answers across
            offers, partners, and performance data.
          </p>
          <div className="flex items-center gap-4 pt-2">
            {[IconBrandTwitter, IconBrandInstagram, IconBrandFacebook, IconBrandLinkedin].map((Icon, index) => (
              <Link key={index} href="#" className="text-foreground/45 transition-colors hover:text-foreground">
                <Icon size={18} />
              </Link>
            ))}
          </div>
        </aside>

        <div>
          <h4 className="mb-5 text-sm font-semibold tracking-wider text-foreground uppercase">Product</h4>
          <ul className="space-y-3">
            {productLinks.map(([item, href]) => (
              <li key={item}>
                <Link href={href} className="text-sm text-foreground/60 transition-colors hover:text-foreground">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold tracking-wider text-foreground uppercase">Company</h4>
          <ul className="space-y-3">
            {companyLinks.map(([item, href]) => (
              <li key={item}>
                <Link href={href} className="text-sm text-foreground/60 transition-colors hover:text-foreground">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold tracking-wider text-foreground uppercase">Legal</h4>
          <ul className="space-y-3">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "Status"].map((item) => (
              <li key={item}>
                <Link href="#" className="text-sm text-foreground/60 transition-colors hover:text-foreground">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border/5 pt-8 sm:flex-row">
        <p className="text-xs text-foreground/45">
          © {year} Adscrush. Built for faster attribution and cleaner performance operations.
        </p>
        <div className="flex items-center gap-6">
          <Link href="#contact" className="text-xs text-foreground/45 hover:text-foreground">
            Help
          </Link>
          <Link href="#" className="text-xs text-foreground/45 hover:text-foreground">
            Terms
          </Link>
          <Link href="#" className="text-xs text-foreground/45 hover:text-foreground">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
