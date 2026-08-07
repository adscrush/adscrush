import { Storage, storeClickId, retrieveClickId, setDedupFlag, hasDedupFlag } from "./storage.js"
import { sendConversion, sendLead } from "./transport.js"
import { applyKeymapping, extractClickIdFromUrl, isBrowser, Logger, normalizeTrackingDomain } from "./utils.js"
import { DEFAULT_COOKIE_EXPIRY, DEFAULT_PARAM_NAME, DEFAULT_TRACKING_DOMAIN } from "./config.js"
import type { AdscrushConfig, ConversionOptions, ClickCapture, LeadOptions } from "./types.js"

// Global state
let _config: AdscrushConfig | null = null
let _clickId: string | null = null
let _storage: Storage | null = null
const _logger: Logger = new Logger(false)
let _initialized = false

/**
 * Initialize the AdsCrush SDK
 */
function init(config: AdscrushConfig = {}): void {

  _config = {
    ...config,
    domain: normalizeTrackingDomain(config.domain ?? DEFAULT_TRACKING_DOMAIN),
    autoInit: config.autoInit ?? true,
    paramName: config.paramName ?? DEFAULT_PARAM_NAME,
    cookieExpiry: config.cookieExpiry ?? DEFAULT_COOKIE_EXPIRY,
  }

  _logger.setEnabled(_config.debug ?? false)
  _storage = new Storage(_config.cookieDomain)
  _initialized = true

  _logger.log("SDK initialized", _config)

  // Auto-capture click ID if enabled
  if (_config.autoInit && isBrowser()) {
    captureClickId()
  }
}

/**
 * Capture click ID from URL and store it
 * Can be called manually with a custom parameter name or click ID
 */
function captureClickId(paramName?: string): ClickCapture {
  if (!_config || !_storage) {
    _logger.warn("SDK not initialized, cannot capture click ID")
    return { clickId: null, source: null }
  }

  // Use provided parameter name or fall back to config
  const parameter = paramName || _config.paramName

  // Try to get from URL first
  const urlClickId = extractClickIdFromUrl(parameter)

  if (urlClickId) {
    _clickId = urlClickId
    storeClickId(_storage, urlClickId, _config.cookieExpiry)
    _logger.log(`Click ID captured from URL parameter "${parameter}"`, urlClickId)
    return { clickId: urlClickId, source: "url" }
  }

  // Fallback to stored value
  const storedClickId = retrieveClickId(_storage)

  if (storedClickId) {
    _clickId = storedClickId
    _logger.log("Click ID retrieved from storage", storedClickId)
    return { clickId: storedClickId, source: "cookie" }
  }

  _logger.warn(`No click ID found in URL parameter "${parameter}" or storage`)
  return { clickId: null, source: null }
}

/**
 * Get the current click ID
 */
function getClickId(): string | null {
  if (_clickId) return _clickId

  if (_storage) {
    _clickId = retrieveClickId(_storage)
  }

  return _clickId
}

/**
 * Manually set the click ID
 */
function setClickId(clickId: string): void {
  if (!clickId) {
    _logger.error("Cannot set empty click ID")
    return
  }

  _clickId = clickId

  if (_storage && _config) {
    storeClickId(_storage, clickId, _config.cookieExpiry)
    _logger.log("Click ID set manually", clickId)
  }
}

/**
 * Track a conversion event
 * Supports both flattened and nested formats
 */
async function trackConversion(options: ConversionOptions = {}): Promise<boolean> {
  if (!_initialized || !_config || !_storage) {
    _logger.error("SDK not initialized. Call init() first.")
    return false
  }

  const finalClickId = options.clickId ?? getClickId()

  if (!finalClickId) {
    _logger.error("No click ID available for conversion tracking")
    options.onError?.(new Error("No click ID available"))
    return false
  }

  // Merge the final conversion data (keymapping fills unset fields from URL params)
  const data = applyKeymapping(
    options.conversionData || options,
    options.keymapping ?? _config.keymapping,
    CONVERSION_KEYMAPPABLE_FIELDS
  )
  const event = data.event ?? "conversion"

  // Prepare query parameters
  const params = new URLSearchParams({
    tid: finalClickId,
    event,
    ...(data.payout !== undefined && { payout: String(data.payout) }),
    ...(data.saleAmount !== undefined && { sale_amount: String(data.saleAmount) }),
    ...(data.currency && { currency: data.currency }),
    ...(data.coupon && { coupon: data.coupon }),
    ...(data.advSub1 && { adv_sub1: data.advSub1 }),
    ...(data.advSub2 && { adv_sub2: data.advSub2 }),
    ...(data.advSub3 && { adv_sub3: data.advSub3 }),
    ...(data.advSub4 && { adv_sub4: data.advSub4 }),
    ...(data.advSub5 && { adv_sub5: data.advSub5 })
  })

  _logger.log("Tracking conversion", {
    clickId: finalClickId,
    event,
    method: options.method ?? "pixel",
    params: Object.fromEntries(params)
  })

  // Check deduplication
  if (hasDedupFlag(_storage!, finalClickId, event)) {
    _logger.log(`Conversion already tracked for event "${event}"`)
    options.onSuccess?.({ success: true, isDuplicate: true })
    return true
  }

  // Send conversion (tracking domain resolved from per-call > init config > default)
  const domain = resolveTrackingDomain(options.domain)
  try {
    const result = await sendConversion({
      domain,
      params,
      method: options.method ?? "pixel"
    })

    if (result.success) {
      // Mark as tracked
      setDedupFlag(_storage!, finalClickId, event)
      _logger.log(`Conversion tracked successfully for event "${event}"`)
      options.onSuccess?.(result)
      return true
    }

    _logger.error(`Conversion tracking failed: ${result.error}`, result)
    options.onError?.(new Error(result.error ?? "Unknown error"))
    return false
  } catch (error) {
    _logger.error("Exception during conversion tracking", error)
    options.onError?.(error instanceof Error ? error : new Error("Unknown error"))
    return false
  }
}

/**
 * Track a lead event (name, phone, email submission)
 */
async function trackLead(options: LeadOptions = {}): Promise<boolean> {
  if (!_initialized || !_config || !_storage) {
    _logger.error("SDK not initialized. Call init() first.")
    return false
  }

  const finalClickId = options.clickId ?? getClickId()

  if (!finalClickId) {
    _logger.error("No click ID available for lead tracking")
    options.onError?.(new Error("No click ID available"))
    return false
  }

  // Check dedup
  if (hasDedupFlag(_storage!, finalClickId, "lead")) {
    _logger.log("Lead already tracked for this click")
    options.onSuccess?.({ success: true, isDuplicate: true })
    return true
  }

  // Merge keymapped URL values into lead fields (explicit values always win)
  const data = applyKeymapping(options, options.keymapping ?? _config.keymapping, LEAD_KEYMAPPABLE_FIELDS)

  // Build sub fields for flexibility
  const params = new URLSearchParams({
    tid: finalClickId,
    ...(data.name && { name: data.name }),
    ...(data.phone && { phone: data.phone }),
    ...(data.email && { email: data.email }),
    ...(data.address && { address: data.address }),
    ...(data.pincode && { pincode: data.pincode }),
    ...(data.city && { city: data.city }),
    ...(data.state && { state: data.state }),
    ...(data.sub1 && { sub1: data.sub1 }),
    ...(data.sub2 && { sub2: data.sub2 }),
    ...(data.sub3 && { sub3: data.sub3 }),
    ...(data.sub4 && { sub4: data.sub4 }),
    ...(data.sub5 && { sub5: data.sub5 }),
    ...(data.payout !== undefined && { payout: String(data.payout) }),
    ...(data.currency && { currency: data.currency }),
  })

  const domain = resolveTrackingDomain(options.domain)

  _logger.log("Tracking lead", { clickId: finalClickId, name: data.name })

  try {
    const result = await sendLead({
      domain,
      params,
      method: options.method ?? "pixel",
    })

    if (result.success) {
      setDedupFlag(_storage!, finalClickId, "lead")
      _logger.log("Lead tracked successfully")
      options.onSuccess?.(result)
      return true
    }

    _logger.error(`Lead tracking failed: ${result.error}`, result)
    options.onError?.(new Error(result.error ?? "Unknown error"))
    return false
  } catch (error) {
    _logger.error("Exception during lead tracking", error)
    options.onError?.(error instanceof Error ? error : new Error("Unknown error"))
    return false
  }
}

/**
 * Check if a conversion has already been tracked
 */
function hasTrackedConversion(event = "conversion"): boolean {
  if (!_storage) return false
  const clickId = getClickId()
  if (!clickId) return false
  return hasDedupFlag(_storage, clickId, event)
}

/**
 * Clear all stored data
 */
function clear(): void {
  _clickId = null

  if (_storage) {
    _storage.clear()
    _logger.log("SDK data cleared")
  }
}

/**
 * Enable/disable debug mode
 */
function setDebug(enabled: boolean): void {
  _logger.setEnabled(enabled)

  if (_config) {
    _config.debug = enabled
  }

  _logger.log(`Debug mode ${enabled ? "enabled" : "disabled"}`)
}

/**
 * Get current configuration
 */
function getConfig(): AdscrushConfig | null {
  return _config
}

/**
 * Fully reset the SDK back to uninitialized state.
 * Clears all stored data, configuration, and resets initialization.
 * Call init() again after this to reinitialize.
 */
function destroy(): void {
  _clickId = null
  _config = null
  _initialized = false

  _storage?.clear()
  _storage = null

  _logger.setEnabled(false)
  _logger.log("SDK destroyed")
}

/**
 * Resolve the tracking domain with precedence:
 * per-call override > init config > default.
 * Returns a normalized base URL (e.g. "https://track.adscrush.com").
 */
function resolveTrackingDomain(override?: string): string {
  return normalizeTrackingDomain(override ?? _config?.domain ?? DEFAULT_TRACKING_DOMAIN)
}

/** Fields that `keymapping` may fill for `trackConversion()` */
const CONVERSION_KEYMAPPABLE_FIELDS = [
  "advSub1",
  "advSub2",
  "advSub3",
  "advSub4",
  "advSub5",
  "coupon",
  "currency",
  "event",
  "saleAmount",
  "payout",
] as const

/** Fields that `keymapping` may fill for `trackLead()` */
const LEAD_KEYMAPPABLE_FIELDS = [
  "name",
  "phone",
  "email",
  "address",
  "pincode",
  "city",
  "state",
  "sub1",
  "sub2",
  "sub3",
  "sub4",
  "sub5",
  "payout",
  "currency",
] as const

/**
 * SDK instance
 */
const sdk = {
  init,
  trackConversion,
  trackLead,
  getClickId,
  setClickId,
  hasTrackedConversion,
  clear,
  setDebug,
  getConfig,
  destroy,
}

// Auto-initialize (always, with or without config)
if (isBrowser()) {
  try {
    const globalConfig = (window as unknown as { adscrushConfig?: AdscrushConfig }).adscrushConfig || {}
    init(globalConfig)
  } catch (error) {
    console.error("Failed to auto-initialize AdsCrush SDK:", error)
  }
}

// Export everything
export default sdk
export {
  init,
  trackConversion,
  trackLead,
  getClickId,
  setClickId,
  hasTrackedConversion,
  clear,
  setDebug,
  getConfig,
  destroy,
}
export type * from "./types.js"

// Make available globally for IIFE build
if (isBrowser()) {
  ;(window as unknown as { AdsCrushSDK: typeof sdk }).AdsCrushSDK = sdk
}
