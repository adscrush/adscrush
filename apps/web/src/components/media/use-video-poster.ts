"use client"

import * as React from "react"

// Global cache: URL → data URL. Avoids re-extracting frames for the same video.
const posterCache = new Map<string, string>()

/**
 * Extracts a single frame from a video URL to use as a poster/thumbnail.
 * Uses canvas to capture the frame and returns a data URL.
 * Results are cached globally to avoid redundant extraction.
 */
export function useVideoPoster(
  url: string | null,
  enabled: boolean = true,
): {
  posterUrl: string | null
  isLoading: boolean
} {
  const [posterUrl, setPosterUrl] = React.useState<string | null>(
    url && posterCache.has(url) ? posterCache.get(url)! : null,
  )
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!url || !enabled) {
      setPosterUrl(null)
      setIsLoading(false)
      return
    }

    // Check cache first
    const cached = posterCache.get(url)
    if (cached) {
      setPosterUrl(cached)
      setIsLoading(false)
      return
    }

    let cancelled = false
    const video = document.createElement("video")
    video.crossOrigin = "anonymous"
    video.preload = "metadata"
    video.muted = true
    video.playsInline = true

    const canvas = document.createElement("canvas")

    video.onloadedmetadata = () => {
      if (cancelled) return
      setIsLoading(true)

      // Seek to 10% of video or 0.5s, whichever is smaller
      const seekTime = Math.min(video.duration * 0.1, 0.5)
      video.currentTime = seekTime
    }

    video.onseeked = () => {
      if (cancelled) return

      try {
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size to video dimensions (capped at reasonable size)
        const maxDim = 300
        const aspect = video.videoWidth / video.videoHeight
        if (aspect >= 1) {
          canvas.width = maxDim
          canvas.height = Math.round(maxDim / aspect)
        } else {
          canvas.height = maxDim
          canvas.width = Math.round(maxDim * aspect)
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8)

        // Cache the result
        posterCache.set(url, dataUrl)

        if (!cancelled) {
          setPosterUrl(dataUrl)
          setIsLoading(false)
        }
      } catch {
        // Canvas tainted or other error
        if (!cancelled) {
          setIsLoading(false)
        }
      }

      video.src = ""
    }

    video.onerror = () => {
      if (!cancelled) {
        setIsLoading(false)
      }
      video.src = ""
    }

    video.src = url

    return () => {
      cancelled = true
      video.src = ""
    }
  }, [url, enabled])

  return { posterUrl, isLoading }
}

/**
 * Hook that tracks whether an element is visible in the viewport.
 */
export function useInView(options?: IntersectionObserverInit): {
  ref: React.RefCallback<Element>
  inView: boolean
} {
  const [inView, setInView] = React.useState(false)
  const [node, setNode] = React.useState<Element | null>(null)

  // Stabilize the merged options reference so the effect doesn't re-run on every render
  const mergedOptions = React.useMemo(
    () => ({
      threshold: options?.threshold ?? 0.1,
      rootMargin: options?.rootMargin,
      root: options?.root,
    }),
    [options?.threshold, options?.rootMargin, options?.root],
  )

  React.useEffect(() => {
    if (!node) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setInView(true)
        // Once visible, stop observing (we only need to trigger once)
        observer.disconnect()
      }
    }, mergedOptions)

    observer.observe(node)
    return () => observer.disconnect()
  }, [node, mergedOptions])

  const ref = React.useCallback((el: Element | null) => {
    setNode(el)
  }, [])

  return { ref, inView }
}
