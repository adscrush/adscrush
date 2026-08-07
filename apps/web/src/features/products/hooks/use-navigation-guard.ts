"use client"

import { useEffect, useRef } from "react"

/**
 * Hook that prevents accidental navigation away from a page with unsaved changes.
 *
 * When `isDirty` is true:
 * - Shows the browser's native confirmation dialog on tab close/refresh (beforeunload)
 * - Intercepts in-app navigation via history.pushState/replaceState patching
 * - Intercepts browser back/forward navigation via popstate
 *
 * When `isDirty` is false:
 * - All navigation proceeds without prompts
 *
 * @param isDirty - Whether the form has unsaved changes
 */
export function useNavigationGuard(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty)

  // Keep the ref in sync so event handlers always have the latest value
  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  // Handle browser beforeunload (tab close, refresh, external navigation)
  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return
      e.preventDefault()
      // Modern browsers ignore custom messages but still show a generic dialog
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isDirty])

  // Handle in-app navigation (Next.js App Router uses pushState) and browser
  // back/forward (popstate). Both are handled in a single effect so they share
  // one reference to the ORIGINAL pushState — the guard's own bookkeeping calls
  // (seeding the back-button trap, re-trapping) must bypass the confirm prompt,
  // otherwise simply arming the guard (e.g. selecting the first image) would
  // trip its own patched pushState and show a spurious dialog.
  useEffect(() => {
    if (!isDirty) return

    const originalPushState = window.history.pushState.bind(window.history)

    // Patch pushState so genuine Next.js client navigations prompt when dirty.
    window.history.pushState = function (
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) {
      if (!isDirtyRef.current) {
        originalPushState(data, unused, url)
        return
      }

      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave this page?"
      )

      // Use the original (unpatched) pushState to perform the real navigation
      // so it is not re-intercepted. If not confirmed, stay on the page.
      if (confirmed) {
        originalPushState(data, unused, url)
      }
    }

    const handlePopState = () => {
      if (!isDirtyRef.current) return

      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave this page?"
      )

      if (!confirmed) {
        // Re-trap the back button via the original pushState so this internal
        // call does not re-trigger the prompt above.
        originalPushState(null, "", window.location.href)
      }
    }

    // Seed a history entry to trap the back button — via the original pushState
    // so arming the guard never shows a spurious prompt.
    originalPushState(null, "", window.location.href)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.history.pushState = originalPushState
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isDirty])
}
