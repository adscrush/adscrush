/**
 * Read a single query parameter from the current page URL
 */
export function getUrlParam(paramName: string): string | null {
  if (typeof window === "undefined") return null

  try {
    const url = new URL(window.location.href)
    return url.searchParams.get(paramName)
  } catch {
    return null
  }
}

/**
 * Extract click ID from URL query parameters
 */
export function extractClickIdFromUrl(paramName = "tid"): string | null {
  return getUrlParam(paramName)
}

/**
 * A single keymapping entry: `<sdkField>:<urlParam>`
 */
export interface KeyMapping {
  sdkField: string
  urlParam: string
}

/**
 * Parse a keymapping array into structured entries.
 * Invalid entries (missing `:`) are skipped.
 *
 * Example: `["sub1:aff_sub1", "sub2:utm_campaign"]` →
 * `[{ sdkField: "sub1", urlParam: "aff_sub1" }, ...]`
 */
export function parseKeymapping(keymapping: string[] | undefined): KeyMapping[] {
  if (!keymapping) return []

  const result: KeyMapping[] = []
  for (const entry of keymapping) {
    const separatorIndex = entry.indexOf(":")
    if (separatorIndex <= 0 || separatorIndex === entry.length - 1) continue

    result.push({
      sdkField: entry.slice(0, separatorIndex).trim(),
      urlParam: entry.slice(separatorIndex + 1).trim(),
    })
  }
  return result
}

/**
 * Fill unset fields on `data` from URL parameters using a keymapping.
 * Only `allowedFields` may be keymapped. Explicitly provided (non-empty)
 * values always win; missing fields are filled from the matching URL parameter.
 *
 * Example: `applyKeymapping({}, ["sub1:aff_sub1"], ["sub1"])` fills `sub1`
 * from `?aff_sub1=...`.
 */
export function applyKeymapping<T extends object>(
  data: T,
  keymapping: string[] | undefined,
  allowedFields: readonly string[]
): T {
  if (!keymapping || keymapping.length === 0) return data

  const result = { ...data } as Record<string, unknown>
  for (const { sdkField, urlParam } of parseKeymapping(keymapping)) {
    // Only allow documented fields — prevents keymapping `domain`, `clickId`, etc.
    if (!allowedFields.includes(sdkField)) continue

    // Fill only unset fields; `undefined`/`null`/`""` count as unset so
    // keymapping works even when the caller didn't pass the field at all.
    const current = result[sdkField]
    if (current !== undefined && current !== null && current !== "") continue

    const value = getUrlParam(urlParam)
    if (value) result[sdkField] = value
  }
  return result as T
}

/**
 * Logger utility
 */
export class Logger {
  private enabled: boolean

  constructor(enabled = false) {
    this.enabled = enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  log(message: string, data?: unknown): void {
    if (!this.enabled) return
    console.log(`[AdsCrush SDK]`, message, data ?? "")
  }

  warn(message: string, data?: unknown): void {
    if (!this.enabled) return
    console.warn(`[AdsCrush SDK]`, message, data ?? "")
  }

  error(message: string, data?: unknown): void {
    if (!this.enabled) return
    console.error(`[AdsCrush SDK]`, message, data ?? "")
  }
}

/**
 * Check if browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

/**
 * Normalize a tracking domain to a base URL without trailing slash.
 * Accepts bare hostnames and full URLs.
 *
 * Examples:
 *   "track.yourdomain.com"          → "https://track.yourdomain.com"
 *   "https://track.yourdomain.com"  → "https://track.yourdomain.com"
 *   "http://localhost:3002"          → "http://localhost:3002"
 */
export function normalizeTrackingDomain(domain: string): string {
  if (domain.startsWith("http://") || domain.startsWith("https://")) {
    return domain.replace(/\/+$/, "")
  }
  // Default to https for bare hostnames
  return `https://${domain}`
}
