"use client"

import { useRef, useEffect, useState } from "react"
import { DashboardHeader } from "./dashboard-header"

export function ScrollAwareHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry?.isIntersecting), { threshold: 0 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/*<div ref={sentinelRef} className="h-px" />*/}
      <DashboardHeader scrolled={scrolled} />
    </>
  )
}
