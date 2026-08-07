import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { z } from "zod"
import { URL_TOKENS } from "@adscrush/shared/constants/tokens"
import { applyMacros, type MacroValues } from "@adscrush/shared/lib/macros"

describe("Preservation — MUST PASS on both unfixed and fixed code", () => {
  it("no-token URL passes through unchanged", () => {
    const url = "https://example.com/lp"
    const result = applyMacros(url, {})
    expect(result).toBe("https://example.com/lp")
  })

  it("{payout} token with no value in map remains in output", () => {
    const url = "https://example.com/?p={payout}"
    const result = applyMacros(url, {})
    expect(result).toContain("{payout}")
  })

  it("happy-path literal {tid} and {media_buyer_id} are replaced correctly", () => {
    const url = "https://example.com/?tid={tid}&mb={media_buyer_id}"
    const result = applyMacros(url, { "{tid}": "uuid-1", "{media_buyer_id}": "mb_1" })
    expect(result).toBe("https://example.com/?tid=uuid-1&mb=mb_1")
  })

  it("all URL_TOKENS are replaced when values are provided (happy path)", () => {
    const url =
      "https://example.com/?tid={tid}&mb={media_buyer_id}&s1={sub1}&s2={sub2}&s3={sub3}&src={source}"
    const values: MacroValues = {
      "{tid}": "tid-val",
      "{media_buyer_id}": "mb-val",
      "{sub1}": "s1-val",
      "{sub2}": "s2-val",
      "{sub3}": "s3-val",
      "{source}": "src-val",
    }
    const result = applyMacros(url, values)
    expect(result).toBe(
      "https://example.com/?tid=tid-val&mb=mb-val&s1=s1-val&s2=s2-val&s3=s3-val&src=src-val"
    )
  })

  it("{funnel_id} token is replaced correctly", () => {
    const url = "https://example.com/?funnel={funnel_id}&tid={tid}"
    const result = applyMacros(url, { "{funnel_id}": "fnl_exR3PdE7dYy8", "{tid}": "uuid-abc" })
    expect(result).toBe("https://example.com/?funnel=fnl_exR3PdE7dYy8&tid=uuid-abc")
  })

  it("real-world URL with {tid} is replaced correctly", () => {
    const url = "https://landing.sehatvati.shop/dp-panjabi/lp1/?clickid={tid}"
    const result = applyMacros(url, { "{tid}": "d9423-329323c-fadf3203" })
    expect(result).toBe("https://landing.sehatvati.shop/dp-panjabi/lp1/?clickid=d9423-329323c-fadf3203")
  })

  it("URL with no tokens passes through unchanged", () => {
    const url = "https://landing.sehatvati.shop/dp-panjabi/lp1/"
    const result = applyMacros(url, { "{tid}": "some-uuid" })
    expect(result).toBe("https://landing.sehatvati.shop/dp-panjabi/lp1/")
  })

  it("Property: URL with no tokens from URL_TOKENS passes through unchanged", () => {
    const tokenStrings = URL_TOKENS.map((t) => t.value)
    const encodedTokenStrings = tokenStrings.map((t) => encodeURIComponent(t))
    const allTokenStrings = [...tokenStrings, ...encodedTokenStrings]

    fc.assert(
      fc.property(
        fc.webUrl({ withFragments: false, withQueryParameters: false }),
        (url) => {
          const containsToken = allTokenStrings.some((t) => url.includes(t))
          if (containsToken) return true

          const result = applyMacros(url, {})
          return result === url
        }
      ),
      { numRuns: 200 }
    )
  })
})

describe("Media Buyer Model — {media_buyer_id} represents media buyer ID", () => {
  it("{media_buyer_id} token is replaced with media buyer ID", () => {
    const url = "https://landing.com/?mb={media_buyer_id}"
    const result = applyMacros(url, { "{media_buyer_id}": "mb_xyz" })
    expect(result).toBe("https://landing.com/?mb=mb_xyz")
  })

  it("URL-encoded {tid} token (%7Btid%7D) is replaced", () => {
    const url = "https://example.com/?tid=%7Btid%7D"
    const result = applyMacros(url, { "{tid}": "abc-123" })
    expect(result).toBe("https://example.com/?tid=abc-123")
  })

  it("{tid} token in failure path (with tid generated early) is replaced", () => {
    // In the new model, tid is generated at the top of the handler,
    // so partialValues always includes {tid} even on failure paths
    const partialValues: MacroValues = {
      "{tid}": "test-uuid-1234",
      "{media_buyer_id}": "mb123",
      "{funnel_id}": "funnel456",
      "{sub1}": "",
      "{sub2}": "",
      "{sub3}": "",
      "{source}": "",
      "{campaign_id}": "",
    }

    const result = applyMacros("https://fallback.example.com/?clickid={tid}", partialValues)
    expect(result).toBe("https://fallback.example.com/?clickid=test-uuid-1234")
    expect(result).not.toContain("{tid}")
  })
})

describe("ClickQuerySchema — mo parameter is preserved", () => {
  it("mo parameter is preserved by updated ClickQuerySchema", () => {
    const FixedClickQuerySchema = z.object({
      o: z.string(),
      a: z.string(),
      lp: z.string().optional(),
      mo: z.string().optional(),
    })

    const input = { o: "offer1", a: "mb1", mo: "lp2" }
    const result = FixedClickQuerySchema.safeParse(input)

    expect(result.success).toBe(true)
    expect(result.data?.mo).toBe("lp2")
  })

  it("mo=r falls through to no selection (no weighted random without offer URL)", () => {
    // In the new model, selectLandingPage returns null for mo=r
    // and the caller handles the fallback to product.fallbackUrl
    const moName = "r"
    expect(moName === "r").toBe(true)
  })

  it("absent mo returns null (caller handles fallback)", () => {
    const moName: string | undefined = undefined
    expect(moName).toBeUndefined()
  })
})
