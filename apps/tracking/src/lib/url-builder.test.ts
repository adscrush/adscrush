import { describe, it, expect } from "vitest"
import { injectTokensIntoUrl, extractQueryParams, isValidUrl } from "./url-builder"

describe("injectTokensIntoUrl", () => {
  it("should inject tokens into a URL without existing query params", () => {
    const result = injectTokensIntoUrl({
      url: "https://example.com/page",
      tokens: { clickid: "abc-123", source: "facebook" },
    })

    expect(result).toBe("https://example.com/page?clickid=abc-123&source=facebook")
  })

  it("should inject tokens into a URL with existing query params", () => {
    const result = injectTokensIntoUrl({
      url: "https://example.com/page?existing=value",
      tokens: { clickid: "abc-123" },
    })

    expect(result).toBe("https://example.com/page?existing=value&clickid=abc-123")
  })

  it("should preserve existing params when override is false", () => {
    const result = injectTokensIntoUrl({
      url: "https://example.com/page?clickid=old",
      tokens: { clickid: "new" },
      override: false,
    })

    expect(result).toBe("https://example.com/page?clickid=old")
  })

  it("should override existing params when override is true", () => {
    const result = injectTokensIntoUrl({
      url: "https://example.com/page?clickid=old",
      tokens: { clickid: "new" },
      override: true,
    })

    expect(result).toBe("https://example.com/page?clickid=new")
  })

  it("should handle hash fragments", () => {
    const result = injectTokensIntoUrl({
      url: "https://example.com/page#section",
      tokens: { clickid: "abc-123" },
    })

    expect(result).toBe("https://example.com/page?clickid=abc-123#section")
  })

  it("should handle relative URLs", () => {
    const result = injectTokensIntoUrl({
      url: "/page?existing=value",
      tokens: { clickid: "abc-123" },
    })

    expect(result).toBe("/page?existing=value&clickid=abc-123")
  })

  it("should skip empty token values", () => {
    const result = injectTokensIntoUrl({
      url: "https://example.com/page",
      tokens: { clickid: "abc-123", empty: "", nullish: null as unknown as string },
    })

    expect(result).toBe("https://example.com/page?clickid=abc-123")
  })

  it("should URL encode special characters", () => {
    const result = injectTokensIntoUrl({
      url: "https://example.com/page",
      tokens: { clickid: "abc 123", special: "a&b=c" },
    })

    const url = new URL(result)
    expect(url.searchParams.get("clickid")).toBe("abc 123")
    expect(url.searchParams.get("special")).toBe("a&b=c")
  })

  it("should handle empty URL", () => {
    const result = injectTokensIntoUrl({
      url: "",
      tokens: { clickid: "abc-123" },
    })

    expect(result).toBe("")
  })

  it("should handle multiple tokens", () => {
    const result = injectTokensIntoUrl({
      url: "https://example.com/page",
      tokens: {
        clickid: "abc-123",
        source: "facebook",
        campaign: "summer-sale",
        adset: "mobile-users",
      },
    })

    const url = new URL(result)
    expect(url.searchParams.get("clickid")).toBe("abc-123")
    expect(url.searchParams.get("source")).toBe("facebook")
    expect(url.searchParams.get("campaign")).toBe("summer-sale")
    expect(url.searchParams.get("adset")).toBe("mobile-users")
  })
})

describe("extractQueryParams", () => {
  it("should extract query parameters from a URL", () => {
    const params = extractQueryParams("https://example.com/page?a=1&b=2&c=3")
    expect(params).toEqual({ a: "1", b: "2", c: "3" })
  })

  it("should handle URLs without query params", () => {
    const params = extractQueryParams("https://example.com/page")
    expect(params).toEqual({})
  })

  it("should handle relative URLs", () => {
    const params = extractQueryParams("/page?a=1&b=2")
    expect(params).toEqual({ a: "1", b: "2" })
  })

  it("should decode URL-encoded values", () => {
    const params = extractQueryParams("https://example.com/page?name=John%20Doe")
    expect(params).toEqual({ name: "John Doe" })
  })
})

describe("isValidUrl", () => {
  it("should validate absolute URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true)
    expect(isValidUrl("http://example.com/page?query=value")).toBe(true)
  })

  it("should validate relative URLs", () => {
    expect(isValidUrl("/page")).toBe(true)
    expect(isValidUrl("/page?query=value")).toBe(true)
    expect(isValidUrl("./relative")).toBe(true)
  })

  it("should invalidate malformed URLs", () => {
    expect(isValidUrl("")).toBe(false)
  })

  it("should validate strings that can be relative paths", () => {
    // Note: Most strings are technically valid as relative paths in URL spec
    // The URL constructor is permissive with relative paths
    expect(isValidUrl("not a url")).toBe(true)
    expect(isValidUrl("some-path")).toBe(true)
    expect(isValidUrl("://invalid")).toBe(true) // Treated as relative path
  })
})
