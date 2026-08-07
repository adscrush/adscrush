import { logger } from "../lib/logger.js"

/**
 * URL Builder Utility
 *
 * Handles intelligent URL construction with automatic token injection.
 * Preserves existing query parameters and properly appends/merges new ones.
 */

const log = logger({ module: "url-builder" })

export interface TokenInjectionConfig {
  /**
   * The base URL to inject tokens into
   */
  url: string
  /**
   * Tokens to inject as query parameters
   * Key is the parameter name, value is the token value
   */
  tokens: Record<string, string>
  /**
   * Whether to override existing parameters with the same name
   * @default false
   */
  override?: boolean
}

/**
 * Injects tokens into a URL as query parameters.
 *
 * Behavior:
 * - Parses existing query parameters
 * - Adds new tokens as query parameters
 * - Preserves hash fragments
 * - Handles both absolute and relative URLs
 * - By default, preserves existing parameters (override: false)
 *
 * @example
 * ```ts
 * injectTokensIntoUrl({
 *   url: 'https://example.com/page?existing=value',
 *   tokens: { clickid: 'abc-123', source: 'facebook' }
 * })
 * // Returns: 'https://example.com/page?existing=value&clickid=abc-123&source=facebook'
 * ```
 */
export function injectTokensIntoUrl(config: TokenInjectionConfig): string {
  const { url, tokens, override = false } = config

  // Handle empty URLs
  if (!url || url.trim() === "") {
    return url
  }

  try {
    // Parse URL - handle both absolute and relative URLs
    let parsedUrl: URL
    let isRelative = false

    try {
      parsedUrl = new URL(url)
    } catch {
      // If URL parsing fails, it might be a relative URL
      // Create a temporary base to parse it
      parsedUrl = new URL(url, "http://temp.local")
      isRelative = true
    }

    // Inject tokens as query parameters
    for (const [key, value] of Object.entries(tokens)) {
      if (value !== undefined && value !== null && value !== "") {
        // Only set if override is true or parameter doesn't exist
        if (override || !parsedUrl.searchParams.has(key)) {
          parsedUrl.searchParams.set(key, value)
        }
      }
    }

    // Return the URL
    if (isRelative) {
      // For relative URLs, return without the temporary base
      return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash
    }

    return parsedUrl.toString()
  } catch (error) {
    // If URL parsing completely fails, fallback to simple concatenation
    log.warn("Failed to parse URL for token injection", { url, message: error instanceof Error ? error.message : String(error) })

    const separator = url.includes("?") ? "&" : "?"
    const queryString = Object.entries(tokens)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&")

    return queryString ? `${url}${separator}${queryString}` : url
  }
}

/**
 * Extracts query parameters from a URL as an object
 */
export function extractQueryParams(url: string): Record<string, string> {
  try {
    const parsedUrl = new URL(url, "http://temp.local")
    const params: Record<string, string> = {}

    for (const [key, value] of parsedUrl.searchParams.entries()) {
      params[key] = value
    }

    return params
  } catch {
    return {}
  }
}

/**
 * Validates if a URL is well-formed
 */
export function isValidUrl(url: string): boolean {
  // Empty strings are not valid URLs
  if (!url || url.trim() === "") {
    return false
  }

  try {
    // Try absolute URL
    new URL(url)
    return true
  } catch {
    try {
      // Try relative URL
      new URL(url, "http://temp.local")
      return true
    } catch {
      return false
    }
  }
}
