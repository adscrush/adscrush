"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@adscrush/ui/components/button"
import { navLinks } from "@/features/home/data"
import { useSession } from "@/lib/auth/client"

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { data } = useSession()
  const user = data?.user

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${scrolled ? "soft-border bg-background/80 backdrop-blur-xl" : "border-transparent bg-transparent"}`}
    >
      <div className="mx-auto flex h-[92px] w-full max-w-[1440px] items-center justify-between px-6 lg:px-24">
        <img
          src="/logo.png"
          alt="Adscrush"
          className="h-10 w-auto object-contain"
        />

        <nav className="hidden items-center lg:flex">
          {navLinks.map((link, index) => (
            <div key={link} className="flex items-center">
              <a
                href={`#${link.toLowerCase()}`}
                className="text-sm text-foreground/70 transition-colors hover:text-foreground"
              >
                {link}
              </a>
              {index < navLinks.length - 1 ? (
                <span className="mx-9 h-5 w-px bg-white/12" />
              ) : null}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Button
              asChild
              variant="hero"
              className="hidden h-9 px-5 lg:inline-flex"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="hero"
              className="hidden h-9 px-5 lg:inline-flex"
            >
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-md border border-border/20 lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {mobileOpen && (
        <div className="home-glass-surface animate-in border-t border-border/10 px-6 py-4 duration-300 fade-in slide-in-from-top-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-sm text-foreground/80"
              >
                {link}
              </a>
            ))}
            <Button asChild variant="hero" className="mt-2 h-10">
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
