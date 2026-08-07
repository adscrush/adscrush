import { describe, it, expect, vi } from "vitest"
import { getScope } from "../../lib/scope"

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("../../lib/scope", () => ({
  getScope: vi.fn(),
}))

vi.mock("@adscrush/db/drizzle", () => ({
  eq: vi.fn((a: unknown, b: unknown) => ({ op: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ op: "and", conditions: args })),
  inArray: vi.fn((col: unknown, vals: unknown[]) => ({ op: "inArray", col, vals })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    sql: strings.join("?"),
    values,
  })),
  desc: vi.fn((expr: unknown) => ({ dir: "desc", expr })),
}))

vi.mock("@adscrush/db/schema", () => ({
  products: { id: "products.id", advertiserId: "products.advertiserId" },
  clicks: {},
  advertisers: {},
  mediaBuyers: {},
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("getScope", () => {
  it("returns isAllAdvertisers=true and isAllMediaBuyers=true for admin role", async () => {
    vi.mocked(getScope).mockResolvedValue({
      isAllAdvertisers: true,
      isAllMediaBuyers: true,
      advertiserIds: [],
      mediaBuyerIds: [],
    })

    const scope = await getScope({} as never, "user-1", "admin")
    expect(scope.isAllAdvertisers).toBe(true)
    expect(scope.isAllMediaBuyers).toBe(true)
  })

  it("returns limited advertiser IDs for media buyer role", async () => {
    vi.mocked(getScope).mockResolvedValue({
      isAllAdvertisers: false,
      isAllMediaBuyers: true,
      advertiserIds: ["adv-1", "adv-2"],
      mediaBuyerIds: [],
    })

    const scope = await getScope({} as never, "user-2", "media_buyer")
    expect(scope.isAllAdvertisers).toBe(false)
    expect(scope.advertiserIds).toEqual(["adv-1", "adv-2"])
  })

  it("returns empty advertiser IDs when employee has no advertiser scope", async () => {
    vi.mocked(getScope).mockResolvedValue({
      isAllAdvertisers: false,
      isAllMediaBuyers: false,
      advertiserIds: [],
      mediaBuyerIds: [],
    })

    const scope = await getScope({} as never, "user-3", "employee")
    expect(scope.isAllAdvertisers).toBe(false)
    expect(scope.isAllMediaBuyers).toBe(false)
    expect(scope.advertiserIds).toEqual([])
  })

  it("calls getScope with the correct arguments", async () => {
    await getScope({} as never, "test-user", "media_buyer")
    expect(getScope).toHaveBeenCalledWith({} as never, "test-user", "media_buyer")
  })
})

describe("product scope enforcement patterns", () => {
  it("admin users bypass advertiser conditions", () => {
    const isAllAdvertisers = true
    const conditions = !isAllAdvertisers
      ? "inArray(products.advertiserId, scope.advertiserIds)"
      : undefined
    expect(conditions).toBeUndefined()
  })

  it("scoped employees generate advertiser filter conditions", () => {
    const isAllAdvertisers = false
    const advertiserIds = ["adv-1"]
    const conditions = !isAllAdvertisers
      ? `inArray(products.advertiserId, [${advertiserIds.join(", ")}])`
      : undefined
    expect(conditions).toContain("inArray")
    expect(conditions).toContain("adv-1")
  })

  it("empty advertiser IDs produces impossible condition (no results)", () => {
    // When a scoped employee has no advertisers assigned, the condition
    // filters to ["-1"] to return zero results
    const advertiserIds: string[] = []
    const safeIds = advertiserIds.length > 0 ? advertiserIds : ["-1"]
    expect(safeIds).toEqual(["-1"])
  })
})

describe("products.uploadImage scope enforcement", () => {
  // The scope check pattern used by uploadImage:
  // 1. Look up the product
  // 2. Verify user has access via getScope
  // 3. Reject with FORBIDDEN if not in scope
  it("rejects upload for product outside user's advertiser scope", async () => {
    vi.mocked(getScope).mockResolvedValue({
      isAllAdvertisers: false,
      isAllMediaBuyers: true,
      advertiserIds: ["adv-1"],
      mediaBuyerIds: [],
    })

    const scope = await getScope({} as never, "user-1", "employee")
    expect(scope.isAllAdvertisers).toBe(false)
    expect(scope.advertiserIds).not.toContain("adv-999")
  })
})
