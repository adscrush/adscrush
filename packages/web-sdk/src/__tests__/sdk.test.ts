import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import AdsCrushSDK from "../index.js"

// Mock window and document
const mockLocation = {
  href: "https://example.com?tid=test-click-id-123",
  search: "?tid=test-click-id-123",
}

Object.defineProperty(globalThis, "window", {
  value: {
    location: mockLocation,
  },
  writable: true,
})

Object.defineProperty(globalThis, "document", {
  value: {
    cookie: "",
  },
  writable: true,
})

/**
 * Mock `global.Image` and record every `img.src` that gets assigned.
 * Returns the list of captured URLs (reset per call).
 *
 * NOTE: do NOT declare `src` as a class field — an own data property
 * would shadow the prototype accessor below and the setter would never run.
 */
function mockImageCapture(): string[] {
  const captured: string[] = []
  const OriginalImage = global.Image
  ;(global as { __originalImage?: typeof Image }).__originalImage = OriginalImage

  global.Image = class {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload()
      }, 10)
    }
  } as unknown as typeof Image

  // Intercept src assignment to capture the final URL
  Object.defineProperty(global.Image.prototype, "src", {
    get() {
      return (this as { __src?: string }).__src ?? ""
    },
    set(value: string) {
      ;(this as { __src?: string }).__src = value
      captured.push(value)
    },
    configurable: true,
  })

  return captured
}

/** Set window.location.href for the duration of a test */
function withMockHref(href: string): () => void {
  const original = window.location
  Object.defineProperty(window, "location", {
    value: { href },
    writable: true,
  })
  return () => {
    Object.defineProperty(window, "location", {
      value: original,
      writable: true,
    })
  }
}

describe("AdsCrush SDK", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Clear SDK state
    AdsCrushSDK.destroy()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    // Restore global.Image if it was mocked
    if ((global as { __originalImage?: typeof Image }).__originalImage) {
      global.Image = (global as { __originalImage?: typeof Image }).__originalImage!
      delete (global as { __originalImage?: typeof Image }).__originalImage
    }
  })

  describe("Initialization", () => {
    it("should initialize with empty config", () => {
      expect(() => {
        AdsCrushSDK.init({})
      }).not.toThrow()
    })

    it("should initialize without any config", () => {
      expect(() => {
        AdsCrushSDK.init()
      }).not.toThrow()
    })

    it("should apply default config values", () => {
      AdsCrushSDK.init({})

      const config = AdsCrushSDK.getConfig()
      expect(config?.paramName).toBe("tid")
      expect(config?.cookieExpiry).toBe(30)
      expect(config?.autoInit).toBe(true)
    })

    it("should respect custom config values", () => {
      AdsCrushSDK.init({
        
        paramName: "click_id",
        cookieExpiry: 60,
        autoInit: false,
        debug: true,
      })

      const config = AdsCrushSDK.getConfig()
      expect(config?.paramName).toBe("click_id")
      expect(config?.cookieExpiry).toBe(60)
      expect(config?.autoInit).toBe(false)
      expect(config?.debug).toBe(true)
    })
  })

  describe("Click ID Management", () => {
    it("should capture click ID from URL on init", () => {
      AdsCrushSDK.init({
        
      })

      const clickId = AdsCrushSDK.getClickId()
      expect(clickId).toBe("test-click-id-123")
    })

    it("should manually set click ID", () => {
      AdsCrushSDK.init({
        
        autoInit: false,
      })

      AdsCrushSDK.setClickId("manual-click-id")
      expect(AdsCrushSDK.getClickId()).toBe("manual-click-id")
    })

    it("should return null if no click ID available", () => {
      // Mock empty URL
      const originalLocation = window.location
      Object.defineProperty(window, "location", {
        value: { href: "https://example.com", search: "" },
        writable: true,
      })

      AdsCrushSDK.init({
        
      })

      expect(AdsCrushSDK.getClickId()).toBeNull()

      // Restore
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      })
    })

    it("should fail if SDK was destroyed and not re-initialized", () => {
      AdsCrushSDK.init({})
      AdsCrushSDK.destroy()

      const clickId = AdsCrushSDK.getClickId()
      expect(clickId).toBeNull()
    })
  })

  describe("Conversion Tracking", () => {
    beforeEach(() => {
      AdsCrushSDK.init({
        
      })
    })

    it("should fail if no click ID available", async () => {
      AdsCrushSDK.destroy()
      AdsCrushSDK.init({
        
        autoInit: false,
      })

      const result = await AdsCrushSDK.trackConversion()
      expect(result).toBe(false)
    })

    it("should fail tracking after destroy without re-init", async () => {
      AdsCrushSDK.init({})
      AdsCrushSDK.destroy()

      const result = await AdsCrushSDK.trackConversion()
      expect(result).toBe(false)
    })

    it("should track basic conversion", async () => {
      AdsCrushSDK.setClickId("test-click-id")

      const OriginalImage = global.Image
      ;(global as { __originalImage?: typeof Image }).__originalImage = OriginalImage

      global.Image = class {
        src = ""
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload()
          }, 10)
        }
      } as unknown as typeof Image

      // Start conversion first, then fire the timer so the promise resolves
      const promise = AdsCrushSDK.trackConversion()
      vi.advanceTimersByTime(10)
      const result = await promise
      expect(result).toBe(true)
    })

    it("should track conversion with options", async () => {
      AdsCrushSDK.setClickId("test-click-id")

      const OriginalImage = global.Image
      ;(global as { __originalImage?: typeof Image }).__originalImage = OriginalImage

      global.Image = class {
        src = ""
        onload: (() => void) | null = null
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload()
          }, 10)
        }
      } as unknown as typeof Image

      const promise = AdsCrushSDK.trackConversion({
        event: "purchase",
        saleAmount: "99.99",
        payout: "15.00",
        currency: "USD",
        advSub1: "order_123",
      })
      vi.advanceTimersByTime(10)
      const result = await promise
      expect(result).toBe(true)
    })

    it("should handle deduplication", async () => {
      AdsCrushSDK.setClickId("test-click-id")

      const OriginalImage = global.Image
      ;(global as { __originalImage?: typeof Image }).__originalImage = OriginalImage

      global.Image = class {
        src = ""
        onload: (() => void) | null = null
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload()
          }, 10)
        }
      } as unknown as typeof Image

      // First conversion
      const p1 = AdsCrushSDK.trackConversion({ event: "purchase" })
      vi.advanceTimersByTime(10)
      await p1

      // Check if already tracked
      expect(AdsCrushSDK.hasTrackedConversion("purchase")).toBe(true)

      // Second conversion (should still return true due to dedup — onSuccess called with isDuplicate)
      const p2 = AdsCrushSDK.trackConversion({ event: "purchase" })
      vi.advanceTimersByTime(10)
      const result = await p2
      expect(result).toBe(true)
    })

    it("should call success callback", async () => {
      AdsCrushSDK.setClickId("test-click-id")

      const OriginalImage = global.Image
      ;(global as { __originalImage?: typeof Image }).__originalImage = OriginalImage

      global.Image = class {
        src = ""
        onload: (() => void) | null = null
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload()
          }, 10)
        }
      } as unknown as typeof Image

      const onSuccess = vi.fn()
      const promise = AdsCrushSDK.trackConversion({ onSuccess })
      vi.advanceTimersByTime(10)
      await promise

      expect(onSuccess).toHaveBeenCalledWith({ success: true })
    })
  })

  describe("Tracking Domain", () => {
    it("should use the init config domain for conversion tracking", async () => {
      AdsCrushSDK.init({ domain: "track.custom-domain.com", autoInit: false })
      AdsCrushSDK.setClickId("domain-test-click")

      const captured = mockImageCapture()
      const promise = AdsCrushSDK.trackConversion({ event: "purchase" })
      vi.advanceTimersByTime(10)
      await promise

      expect(captured[0]).toMatch(/^https:\/\/track\.custom-domain\.com\/conversion\/pixel\?tid=domain-test-click/)
    })

    it("should use the init config domain for lead tracking", async () => {
      AdsCrushSDK.init({ domain: "track.custom-domain.com", autoInit: false })
      AdsCrushSDK.setClickId("domain-test-click")

      const captured = mockImageCapture()
      const promise = AdsCrushSDK.trackLead({ name: "John", phone: "123" })
      vi.advanceTimersByTime(10)
      await promise

      expect(captured[0]).toMatch(/^https:\/\/track\.custom-domain\.com\/lead\/pixel\?tid=domain-test-click/)
    })

    it("should let a per-call domain override the init config", async () => {
      AdsCrushSDK.init({ domain: "track.default.com", autoInit: false })
      AdsCrushSDK.setClickId("domain-test-click")

      const captured = mockImageCapture()
      const promise = AdsCrushSDK.trackConversion({
        event: "purchase",
        domain: "track.override.com",
      })
      vi.advanceTimersByTime(10)
      await promise

      expect(captured[0]).toMatch(/^https:\/\/track\.override\.com\/conversion\/pixel/)
    })

    it("should normalize bare hostnames to https and strip trailing slashes", async () => {
      AdsCrushSDK.init({ domain: "https://track.custom-domain.com/", autoInit: false })
      AdsCrushSDK.setClickId("domain-test-click")

      const captured = mockImageCapture()
      const promise = AdsCrushSDK.trackLead({ name: "Jane" })
      vi.advanceTimersByTime(10)
      await promise

      expect(captured[0]).toMatch(/^https:\/\/track\.custom-domain\.com\/lead\/pixel/)
      expect(captured[0]).not.toContain("//lead")
    })
  })

  describe("Keymapping", () => {
    it("should fill sub fields from URL params in trackLead", async () => {
      const restore = withMockHref("https://example.com?tid=keymap-click&aff_sub1=value1&utm_campaign=spring")
      try {
        AdsCrushSDK.init({ domain: "track.custom.com", autoInit: false })
        AdsCrushSDK.setClickId("keymap-click")

        const captured = mockImageCapture()
        const promise = AdsCrushSDK.trackLead({
          name: "John",
          keymapping: ["sub1:aff_sub1", "sub2:utm_campaign"],
        })
        vi.advanceTimersByTime(10)
        await promise

        expect(captured[0]).toContain("sub1=value1")
        expect(captured[0]).toContain("sub2=spring")
      } finally {
        restore()
      }
    })

    it("should fill advSub fields from URL params in trackConversion", async () => {
      const restore = withMockHref("https://example.com?tid=keymap-click&aff_sub3=network&promo=SAVE10")
      try {
        AdsCrushSDK.init({ domain: "track.custom.com", autoInit: false })
        AdsCrushSDK.setClickId("keymap-click")

        const captured = mockImageCapture()
        const promise = AdsCrushSDK.trackConversion({
          event: "purchase",
          keymapping: ["advSub3:aff_sub3", "coupon:promo"],
        })
        vi.advanceTimersByTime(10)
        await promise

        expect(captured[0]).toContain("adv_sub3=network")
        expect(captured[0]).toContain("coupon=SAVE10")
      } finally {
        restore()
      }
    })

    it("should let explicit values win over keymapped values", async () => {
      const restore = withMockHref("https://example.com?tid=keymap-click&aff_sub1=value1")
      try {
        AdsCrushSDK.init({ domain: "track.custom.com", autoInit: false })
        AdsCrushSDK.setClickId("keymap-click")

        const captured = mockImageCapture()
        const promise = AdsCrushSDK.trackLead({
          name: "John",
          sub1: "explicit",
          keymapping: ["sub1:aff_sub1"],
        })
        vi.advanceTimersByTime(10)
        await promise

        expect(captured[0]).toContain("sub1=explicit")
        expect(captured[0]).not.toContain("sub1=value1")
      } finally {
        restore()
      }
    })

    it("should apply keymapping from init config to both methods", async () => {
      const restore = withMockHref("https://example.com?tid=keymap-click&aff_sub5=fromconfig&sub=fromurl")
      try {
        AdsCrushSDK.init({
          domain: "track.custom.com",
          autoInit: false,
          keymapping: ["advSub5:aff_sub5", "sub1:sub"],
        })
        AdsCrushSDK.setClickId("keymap-click")

        const capturedLead = mockImageCapture()
        const pLead = AdsCrushSDK.trackLead({ name: "John" })
        vi.advanceTimersByTime(10)
        await pLead
        expect(capturedLead[0]).toContain("sub1=fromurl")

        const capturedConv = mockImageCapture()
        const pConv = AdsCrushSDK.trackConversion({ event: "purchase" })
        vi.advanceTimersByTime(10)
        await pConv
        expect(capturedConv[0]).toContain("adv_sub5=fromconfig")
      } finally {
        restore()
      }
    })
  })

  describe("Debug Mode", () => {
    it("should enable debug mode", () => {
      AdsCrushSDK.init({
        
        debug: false,
      })

      AdsCrushSDK.setDebug(true)
      const config = AdsCrushSDK.getConfig()
      expect(config?.debug).toBe(true)
    })

    it("should disable debug mode", () => {
      AdsCrushSDK.init({
        
        debug: true,
      })

      AdsCrushSDK.setDebug(false)
      const config = AdsCrushSDK.getConfig()
      expect(config?.debug).toBe(false)
    })
  })

  describe("Clear Data", () => {
    it("should clear all stored data", () => {
      AdsCrushSDK.init({
        
      })

      AdsCrushSDK.setClickId("test-click-id")
      expect(AdsCrushSDK.getClickId()).toBe("test-click-id")

      AdsCrushSDK.clear()
      expect(AdsCrushSDK.getClickId()).toBeNull()
    })
  })
})
