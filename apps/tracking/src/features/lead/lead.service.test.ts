import { describe, it, expect, vi, beforeEach } from "vitest"
import { sanitize, normalizePhone, normalizeEmail, verifyApiKey } from "./lead.service.js"
import type { handleLeadSubmission as HandleLeadSubmission } from "./lead.service.js"

// We mock the DB and crypto dependencies so handleLeadSubmission can be tested
// without a real Postgres connection, encryption key, or env vars.
vi.mock("@adscrush/db/drizzle", () => ({
  eq: vi.fn((a: unknown, b: unknown) => ({ op: "eq", column: a, value: b })),
}))
vi.mock("@adscrush/db/schema", () => ({
  clicks: { tid: "clicks.tid", productId: "clicks.productId", mediaBuyerId: "clicks.mediaBuyerId", advertiserId: "clicks.advertiserId", campaignId: "clicks.campaignId", geoCountry: "clicks.geoCountry", id: "clicks.id" },
  leads: { id: "leads.id", clickId: "leads.clickId", status: "leads.status" },
  products: { id: "products.id", status: "products.status", defaultPayout: "products.defaultPayout", currency: "products.currency" },
}))
vi.mock("@adscrush/db/encrypt", () => ({
  encryptPII: vi.fn().mockResolvedValue("encrypted-base64"),
}))
vi.mock("@adscrush/shared/constants/status", () => ({
  LEAD_STATUS: { PENDING: "pending", APPROVED: "approved", REJECTED: "rejected" },
}))
vi.mock("@adscrush/shared/lib/id", () => ({
  generateId: vi.fn().mockReturnValue("lead_test123"),
}))
vi.mock("../../config/database.js", () => ({
  getDatabase: vi.fn(),
}))
vi.mock("../../lib/uuid.js", () => ({
  isUuid: vi.fn(),
}))
vi.mock("../../config/env.js", () => ({
  default: { LEAD_API_KEY: "test-api-key" },
}))

// ── Pure function tests ──────────────────────────────────────────────────────

describe("sanitize", () => {
  it("returns null for undefined", () => {
    expect(sanitize(undefined, 100)).toBeNull()
  })

  it("returns null for empty string", () => {
    expect(sanitize("", 100)).toBeNull()
  })

  it("returns null for whitespace-only string", () => {
    expect(sanitize("   ", 100)).toBeNull()
  })

  it("trims whitespace", () => {
    expect(sanitize("  hello  ", 100)).toBe("hello")
  })

  it("truncates to max length", () => {
    expect(sanitize("a".repeat(50), 10)).toBe("a".repeat(10))
  })

  it("returns the value as-is when within limits", () => {
    expect(sanitize("John Doe", 200)).toBe("John Doe")
  })
})

describe("normalizePhone", () => {
  it("strips non-digit characters", () => {
    expect(normalizePhone("+1 (555) 123-4567")).toBe("15551234567")
  })

  it("returns empty string when no digits", () => {
    expect(normalizePhone("abc-def")).toBe("")
  })

  it("preserves digits only", () => {
    expect(normalizePhone("12345")).toBe("12345")
  })
})

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  John.Doe@Example.COM  ")).toBe("john.doe@example.com")
  })

  it("lowercases already-lower email", () => {
    expect(normalizeEmail("john@example.com")).toBe("john@example.com")
  })
})

describe("verifyApiKey", () => {
  it("returns true when x-api-key matches", () => {
    const req = new Request("http://localhost", {
      headers: { "x-api-key": "test-api-key" },
    })
    expect(verifyApiKey(req)).toBe(true)
  })

  it("returns true when Authorization Bearer matches", () => {
    const req = new Request("http://localhost", {
      headers: { authorization: "Bearer test-api-key" },
    })
    expect(verifyApiKey(req)).toBe(true)
  })

  it("returns false when x-api-key does not match", () => {
    const req = new Request("http://localhost", {
      headers: { "x-api-key": "wrong-key" },
    })
    expect(verifyApiKey(req)).toBe(false)
  })

  it("returns false when no auth header is present", () => {
    const req = new Request("http://localhost")
    expect(verifyApiKey(req)).toBe(false)
  })
})

// ── handleLeadSubmission (unit tests with mocked deps) ───────────────────────

describe("handleLeadSubmission", () => {
  let mockDb: ReturnType<typeof vi.fn>
  let mockIsUuid: ReturnType<typeof vi.fn>
  let handleLeadSubmission: typeof HandleLeadSubmission

  // We need to re-import the module with fresh mocks per test
  beforeEach(async () => {
    vi.resetModules()
    // Re-bind mocks
    const dbModule = await import("../../config/database.js")
    const uuidModule = await import("../../lib/uuid.js")
    mockDb = dbModule.getDatabase as unknown as ReturnType<typeof vi.fn>
    mockIsUuid = uuidModule.isUuid as unknown as ReturnType<typeof vi.fn>

    // Build a fake query builder
    const fakeWhere = vi.fn()
    const fakeLimit = vi.fn()
    const fakeSelect = vi.fn()
    const fakeFrom = vi.fn()
    const fakeInsert = vi.fn()
    const fakeValues = vi.fn()
    const fakeOnConflict = vi.fn()
    const fakeReturning = vi.fn()

    // Chain: db.select().from(table).where(...).limit(1)
    fakeSelect.mockReturnValue({ from: fakeFrom })
    fakeFrom.mockImplementation(() => ({ where: fakeWhere }))
    fakeWhere.mockImplementation(() => ({ limit: fakeLimit }))
    fakeLimit.mockResolvedValue([]) // default: no rows found

    // Chain: db.insert(table).values(...).onConflictDoNothing().returning(...)
    fakeInsert.mockReturnValue({ values: fakeValues })
    fakeValues.mockReturnValue({ onConflictDoNothing: fakeOnConflict })
    fakeOnConflict.mockReturnValue({ returning: fakeReturning })
    fakeReturning.mockResolvedValue([])

    mockDb.mockReturnValue({
      select: fakeSelect,
      insert: fakeInsert,
    })

    // Re-import the real module
    const leadModule = await import("./lead.service.js")
    handleLeadSubmission = leadModule.handleLeadSubmission
  })

  it("returns 400 when tid is empty", async () => {
    const result = await handleLeadSubmission({
      tid: "",
      method: "postback",
      request: new Request("http://localhost"),
    })
    expect(result.success).toBe(false)
    expect(result.status).toBe(400)
    expect(result.error).toBe("tid is required")
  })

  it("returns 404 when tid is not a valid UUID", async () => {
    mockIsUuid.mockReturnValue(false)

    const result = await handleLeadSubmission({
      tid: "not-a-uuid",
      method: "postback",
      request: new Request("http://localhost", {
        headers: { "x-api-key": "test-api-key" },
      }),
    })
    expect(result.success).toBe(false)
    expect(result.status).toBe(404)
    expect(result.error).toContain("No click found")
  })

  it("returns 404 when click is not found", async () => {
    mockIsUuid.mockReturnValue(true)

    const result = await handleLeadSubmission({
      tid: "00000000-0000-0000-0000-000000000000",
      method: "postback",
      request: new Request("http://localhost", {
        headers: { "x-api-key": "test-api-key" },
      }),
    })
    expect(result.success).toBe(false)
    expect(result.status).toBe(404)
    expect(result.error).toContain("No click found")
  })
})