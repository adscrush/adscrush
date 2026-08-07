"use client"

import { useCallback, useEffect, useRef } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js"

let scriptPromise: Promise<void> | null = null

/** Loads the Turnstile script exactly once and resolves when ready. */
function loadTurnstileScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error("Failed to load Turnstile script"))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

interface TurnstileWidgetProps {
  siteKey: string
  theme?: "auto" | "light" | "dark"
  /** Called with the verification token when solved, or null on expiry/error. */
  onVerify: (token: string | null) => void
}

export function TurnstileWidget({ siteKey, theme = "auto", onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onVerifyRef = useRef(onVerify)

  useEffect(() => {
    onVerifyRef.current = onVerify
  }, [onVerify])

  const handleVerify = useCallback((token: string) => {
    onVerifyRef.current(token)
  }, [])

  const handleExpire = useCallback(() => {
    onVerifyRef.current(null)
  }, [])

  const handleError = useCallback(() => {
    onVerifyRef.current(null)
  }, [])

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: siteKey,
          theme,
          appearance: "execute",
          callback: handleVerify,
          "expired-callback": handleExpire,
          "error-callback": handleError,
        })
      })
      .catch(() => {
        onVerifyRef.current(null)
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, theme, handleVerify, handleExpire, handleError])

  return <div ref={containerRef} className="turnstile-widget [&>iframe]:max-w-full [&>iframe]:rounded-md" />
}
