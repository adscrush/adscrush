import { describe, it, expect, vi, beforeEach } from "vitest"

// The routes call getDatabase() (creating a real pool) and trackConversion().
// Mock both so we test the HTTP layer in isolation.
vi.mock("../../config/database.js", () => ({
  getDatabase: vi.fn().mockReturnValue({ mock: true }),
}))

vi.mock("./service.js", () => ({
  trackConversion: vi.fn(),
}))

// Import after mocks are registered
import { conversionRoute } from "./track.route.js"
import { pixelRoute } from "./pixel.route.js"
import { postbackRoute } from "./postback.route.js"
import { getDatabase } from "../../config/database.js"
import { trackConversion } from "./service.js"

const mockTrack = trackConversion as ReturnType<typeof vi.fn>
const mockGetDatabase = getDatabase as ReturnType<typeof vi.fn>

const VALID_UUID = "00000000-0000-0000-0000-000000000000"

describe("POST /conversion/track", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTrack.mockReset()
  })

  it("returns 400 when neither tid nor click_id is provided", async () => {
    const res = await conversionRoute.handle(
      new Request("http://localhost/conversion/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("INVALID_PARAMETERS")
    expect(body.message).toContain("tid or click_id is required")
  })

  it("returns 400 with the service error when tracking fails", async () => {
    mockTrack.mockResolvedValue({ success: false, error: "Click not found" })

    const res = await conversionRoute.handle(
      new Request("http://localhost/conversion/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tid: VALID_UUID }),
      })
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ success: false, error: "Click not found" })
    expect(mockGetDatabase).toHaveBeenCalled()
  })

  it("returns 200 with conversion id on success", async () => {
    mockTrack.mockResolvedValue({
      success: true,
      isDuplicate: false,
      conversionId: "cnv_1",
    })

    const res = await conversionRoute.handle(
      new Request("http://localhost/conversion/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tid: VALID_UUID,
          event: "purchase",
          payout: "3.00",
          adv_sub1: "campaign-a",
        }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      isDuplicate: false,
      conversionId: "cnv_1",
    })
    expect(mockTrack).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tid: VALID_UUID,
        event: "purchase",
        method: "s2s",
        advSub1: "campaign-a",
      })
    )
  })

  it("falls back to click_id when tid is absent", async () => {
    mockTrack.mockResolvedValue({
      success: true,
      isDuplicate: false,
      conversionId: "cnv_1",
    })

    const res = await conversionRoute.handle(
      new Request("http://localhost/conversion/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ click_id: VALID_UUID }),
      })
    )

    expect(res.status).toBe(200)
    expect(mockTrack).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tid: VALID_UUID })
    )
  })

  it("returns 500 when the service throws", async () => {
    mockTrack.mockRejectedValue(new Error("db down"))

    const res = await conversionRoute.handle(
      new Request("http://localhost/conversion/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tid: VALID_UUID }),
      })
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("TRACKING_ERROR")
  })
})

describe("GET /conversion/pixel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The pixel route chains .then() on the service result, so it must always
    // resolve a promise (a bare mockReset() returns undefined → TypeError).
    mockTrack.mockReset()
    mockTrack.mockResolvedValue({
      success: true,
      isDuplicate: false,
      conversionId: "cnv_1",
    })
  })

  it("returns a 1x1 gif with no-cache headers", async () => {
    const res = await pixelRoute.handle(
      new Request("http://localhost/conversion/pixel?tid=" + VALID_UUID)
    )

    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("image/gif")
    expect(res.headers.get("cache-control")).toBe("no-cache, no-store, must-revalidate")
    const bytes = new Uint8Array(await res.arrayBuffer())
    // GIF magic header
    const magic = String.fromCharCode(...bytes.subarray(0, 3))
    expect(magic).toBe("GIF")
  })

  it("fires trackConversion for a tid", async () => {
    mockTrack.mockResolvedValue({ success: true, isDuplicate: false, conversionId: "cnv_1" })

    await pixelRoute.handle(
      new Request("http://localhost/conversion/pixel?tid=" + VALID_UUID)
    )

    expect(mockTrack).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tid: VALID_UUID, method: "pixel" })
    )
  })

  it("does not call trackConversion when no click id is present", async () => {
    await pixelRoute.handle(new Request("http://localhost/conversion/pixel"))

    expect(mockTrack).not.toHaveBeenCalled()
  })

  it("maps the iframe method when query method is iframe", async () => {
    mockTrack.mockResolvedValue({ success: true, isDuplicate: false })

    await pixelRoute.handle(
      new Request("http://localhost/conversion/pixel?tid=" + VALID_UUID + "&method=iframe")
    )

    expect(mockTrack).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ method: "iframe" })
    )
  })

  it("extracts client IP from x-forwarded-for and user-agent headers", async () => {
    mockTrack.mockResolvedValue({ success: true, isDuplicate: false })

    await pixelRoute.handle(
      new Request("http://localhost/conversion/pixel?tid=" + VALID_UUID, {
        headers: {
          "x-forwarded-for": "203.0.113.9, 10.0.0.1",
          "user-agent": "test-agent/1.0",
          referer: "https://example.com/landing",
        },
      })
    )

    expect(mockTrack).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ipAddress: "203.0.113.9",
        userAgent: "test-agent/1.0",
        referrerUrl: "https://example.com/landing",
      })
    )
  })

  it("still returns the gif when tracking fails (fire-and-forget)", async () => {
    mockTrack.mockResolvedValue({ success: false, error: "Click not found" })

    const res = await pixelRoute.handle(
      new Request("http://localhost/conversion/pixel?tid=" + VALID_UUID)
    )

    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("image/gif")
  })
})

describe("GET /conversion/postback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTrack.mockReset()
  })

  it("returns 400 when neither tid nor click_id is provided", async () => {
    const res = await postbackRoute.handle(
      new Request("http://localhost/conversion/postback")
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("INVALID_PARAMETERS")
  })

  it("returns 400 with the service error when tracking fails", async () => {
    mockTrack.mockResolvedValue({ success: false, error: "Click not found" })

    const res = await postbackRoute.handle(
      new Request("http://localhost/conversion/postback?tid=" + VALID_UUID)
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ success: false, error: "Click not found" })
  })

  it("returns 200 with conversion id on success", async () => {
    mockTrack.mockResolvedValue({
      success: true,
      isDuplicate: true,
      conversionId: "cnv_existing",
    })

    const res = await postbackRoute.handle(
      new Request("http://localhost/conversion/postback?click_id=" + VALID_UUID + "&event=sale")
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      isDuplicate: true,
      conversionId: "cnv_existing",
    })
    expect(mockTrack).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tid: VALID_UUID, event: "sale", method: "postback" })
    )
  })

  it("returns 500 when the service throws", async () => {
    mockTrack.mockRejectedValue(new Error("boom"))

    const res = await postbackRoute.handle(
      new Request("http://localhost/conversion/postback?tid=" + VALID_UUID)
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("TRACKING_ERROR")
  })
})
