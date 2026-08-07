import { getCountryDataList } from "countries-list"
import { BrowserName, DeviceType, OSName } from "ua-parser-js/enums"

// ─── Countries ────────────────────────────────────────────────────────────────

export interface Country {
  /** ISO 3166-1 alpha-2 code, e.g. "US" */
  code: string
  /** English country name, e.g. "United States" */
  name: string
  /**
   * Flag image URL from flagcdn.com.
   * Use `flagUrl` for 1x and build a 2x srcSet from `flagUrl2x` for retina displays.
   * No API key or rate limits — flagcdn.com is a free, stable CDN.
   */
  flagUrl: string
  /** 2x (40px wide) version for retina displays */
  flagUrl2x: string
}

export const COUNTRIES: Country[] = getCountryDataList()
  .map((country) => {
    const code = country.iso2.toLowerCase()
    return {
      code: country.iso2,
      name: country.name,
      flagUrl: `https://flagcdn.com/w20/${code}.png`,
      flagUrl2x: `https://flagcdn.com/w40/${code}.png`,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

// ─── Browsers ─────────────────────────────────────────────────────────────────

/**
 * All browser names recognised by ua-parser-js v2.
 * These are the exact values the tracker will detect from User-Agent strings,
 * so storing/comparing these values guarantees no mismatch between UI and tracker.
 */
export const BROWSER_NAMES: readonly string[] = Object.values(BrowserName)

// ─── Operating Systems ────────────────────────────────────────────────────────

/**
 * All OS names recognised by ua-parser-js v2.
 * Same guarantee as BROWSER_NAMES — tracker uses the same enum.
 */
export const OS_NAMES: readonly string[] = Object.values(OSName)

// ─── Device Types ─────────────────────────────────────────────────────────────

/**
 * All device types recognised by ua-parser-js v2.
 * Note: ua-parser-js returns `undefined` for desktop (it's the absence of a type).
 * The tracker normalises `undefined` → `"desktop"` before comparison.
 */
export const DEVICE_TYPES: readonly string[] = Object.values(DeviceType)
