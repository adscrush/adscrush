/**
 * Core SDK configuration
 */
export interface AdscrushConfig {
  /**
   * Custom tracking domain (e.g., "track.yourdomain.com")
   * If not set, defaults to "track.adscrush.com"
   * Accepts bare hostnames ("track.yourdomain.com") or full URLs ("https://track.yourdomain.com")
   */
  domain?: string

  /**
   * Cookie domain for cross-subdomain tracking (e.g., ".yourdomain.com")
   * If not set, uses current domain
   */
  cookieDomain?: string

  /**
   * Cookie expiration in days (default: 30)
   */
  cookieExpiry?: number

  /**
   * URL parameter name for click ID (default: "tid")
   */
  paramName?: string

  /**
   * Enable debug logging
   */
  debug?: boolean

  /**
   * Auto-initialize: capture click ID from URL on load
   * Default: true
   */
  autoInit?: boolean

  /**
   * Map URL parameters on the current page to SDK fields, e.g.
   * `["sub1:aff_sub1", "sub2:utm_campaign"]`.
   * Applied to both `trackConversion()` and `trackLead()` unless overridden
   * per call. Explicitly provided values always win over keymapped values.
   */
  keymapping?: string[]
}

/**
 * Conversion data (nested format for cleaner organization)
 */
export interface ConversionData {
  /**
   * Event name (default: "conversion")
   * Use custom names like "purchase", "signup", "lead", etc.
   */
  event?: string

  /**
   * Payout amount (string to preserve precision)
   * Falls back to product's default payout if not set
   */
  payout?: string | number

  /**
   * Sale amount (customer paid amount)
   */
  saleAmount?: string | number

  /**
   * Currency code (default: "USD")
   */
  currency?: string

  /**
   * Coupon/promo code used
   */
  coupon?: string

  /**
   * Advertiser custom parameters (sub-IDs for passing data)
   */
  advSub1?: string
  advSub2?: string
  advSub3?: string
  advSub4?: string
  advSub5?: string
}

/**
 * Lead tracking options
 */
export interface LeadOptions {
  /** Custom tracking domain */
  domain?: string
  /**
   * Map URL parameters on the current page to lead fields, e.g.
   * `["sub1:aff_sub1", "email:user_email"]`.
   * Explicitly provided values always win over keymapped values.
   */
  keymapping?: string[]
  /** Override click ID */
  clickId?: string
  /** Lead name */
  name?: string
  /** Phone number */
  phone?: string
  /** Email address */
  email?: string
  /** Street address */
  address?: string
  /** Postal code / pincode */
  pincode?: string
  /** City */
  city?: string
  /** State or province */
  state?: string
  /** Custom sub fields */
  sub1?: string
  sub2?: string
  sub3?: string
  sub4?: string
  sub5?: string
  /** Payout amount */
  payout?: string | number
  /** Currency code */
  currency?: string
  /** Tracking method: "pixel", "iframe", or "postback" */
  method?: "pixel" | "iframe" | "postback"
  /** Success callback */
  onSuccess?: (response?: ConversionResponse) => void
  /** Error callback */
  onError?: (error: Error) => void
}

/**
 * Conversion tracking options
 * Supports both flattened and nested formats
 */
export interface ConversionOptions extends Partial<ConversionData> {
  /**
   * Custom tracking domain for this specific conversion (e.g., "track.yourdomain.com")
   * Overrides the domain set in init().
   * If not set, uses the domain from init() or the default "track.adscrush.com"
   * Accepts bare hostnames or full URLs.
   */
  domain?: string

  /**
   * Map URL parameters on the current page to conversion fields, e.g.
   * `["advSub1:aff_sub1", "coupon:promo"]`.
   * Explicitly provided values always win over keymapped values.
   */
  keymapping?: string[]

  /**
   * Nested conversion data (alternative to flattened format)
   * Use either flattened OR nested format, not both
   */
  conversionData?: ConversionData

  /**
   * Tracking method: "pixel", "iframe", or "postback"
   * - pixel: 1x1 image tag (default, most compatible)
   * - iframe: hidden iframe (better for cross-domain)
   * - postback: direct API call (requires CORS)
   */
  method?: "pixel" | "iframe" | "postback"

  /**
   * Override the click ID (tid) for this conversion
   * If not provided, uses auto-captured click ID
   */
  clickId?: string

  /**
   * Callback fired on successful tracking
   */
  onSuccess?: (response?: ConversionResponse) => void

  /**
   * Callback fired on tracking error
   */
  onError?: (error: Error) => void
}

/**
 * Response from conversion tracking API
 */
export interface ConversionResponse {
  success: boolean
  isDuplicate?: boolean
  conversionId?: string
  error?: string
  message?: string
}

/**
 * Click capture result
 */
export interface ClickCapture {
  clickId: string | null
  source: "url" | "cookie" | "manual" | null
}

/**
 * SDK instance methods
 */
export interface AdscrushSDK {
  /**
   * Initialize or reconfigure the SDK
   */
  init: (config: AdscrushConfig) => void

  /**
   * Track a conversion event
   */
  trackConversion: (options?: ConversionOptions) => Promise<boolean>

  /**
   * Track a lead event (name, phone, email submission)
   */
  trackLead: (options?: LeadOptions) => Promise<boolean>

  /**
   * Get the current click ID (tid)
   */
  getClickId: () => string | null

  /**
   * Manually set the click ID
   */
  setClickId: (clickId: string) => void

  /**
   * Check if a conversion has already been tracked (dedup check)
   */
  hasTrackedConversion: (event?: string) => boolean

  /**
   * Clear all stored data (click ID, dedup flags)
   */
  clear: () => void

  /**
   * Enable/disable debug mode
   */
  setDebug: (enabled: boolean) => void

  /**
   * Get current configuration
   */
  getConfig: () => AdscrushConfig | null

  /**
   * Fully reset the SDK back to uninitialized state.
   * Clears all stored data, configuration, and resets initialization.
   * Call init() again after this to reinitialize.
   */
  destroy: () => void
}

/**
 * Internal storage interface
 */
export interface StorageAdapter {
  get: (key: string) => string | null
  set: (key: string, value: string, expiryDays?: number) => void
  remove: (key: string) => void
  clear: () => void
}
