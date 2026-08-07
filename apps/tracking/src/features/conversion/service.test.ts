import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Database } from "@adscrush/db"
import { trackConversion } from "./service.js"
import { isUuid } from "../../lib/uuid.js"
import { encryptPII } from "@adscrush/db/encrypt"
import { generateId } from "@adscrush/shared/lib/id"
import { CONVERSION_STATUS } from "@adscrush/shared/constants/status"

// Mock the DB layer — trackConversion receives the db as an argument, so we
// can exercise the real service logic against a fake query-builder chain.
vi.mock("@adscrush/db/drizzle", () => ({
  eq: vi.fn((a: unknown, b: unknown) => ({ op: "eq", column: a, value: b })),
  and: vi.fn((...args: unknown[]) => ({ op: "and", args })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    op: "sql",
    query: strings.join("?"),
    values,
  })),
}))

vi.mock("@adscrush/db/schema", () => ({
  clicks: {
    tid: "clicks.tid",
    id: "clicks.id",
    productId: "clicks.productId",
    mediaBuyerId: "clicks.mediaBuyerId",
    advertiserId: "clicks.advertiserId",
    campaignId: "clicks.campaignId",
    adAccountId: "clicks.adAccountId",
    creativeId: "clicks.creativeId",
    creativeName: "clicks.creativeName",
    creativeThumbnailUrl: "clicks.creativeThumbnailUrl",
  },
  conversions: {
    id: "conversions.id",
    clickId: "conversions.clickId",
    event: "conversions.event",
  },
  products: {
    id: "products.id",
    status: "products.status",
    defaultPayout: "products.defaultPayout",
    defaultRevenue: "products.defaultRevenue",
    currency: "products.currency",
  },
}))

vi.mock("@adscrush/db/encrypt", () => ({
  encryptPII: vi.fn().mockResolvedValue("encrypted-base64"),
}))

vi.mock("../../lib/uuid.js", () => ({
  isUuid: vi.fn(),
}))

vi.mock("@adscrush/shared/lib/id", () => ({
  generateId: vi.fn().mockReturnValue("cnv_test123"),
}))

// ─── Mock DB / query-builder helpers ────────────────────────────────────────

interface FakeRow {
  id?: string
  [key: string]: unknown
}

/** Captured insert values, populated by mockInsert below (module scope so the
 *  module-level helper can write to it; reset in beforeEach). */
let capturedInsertValues: unknown[] = []

/** Builds a db.select().from().where().limit(1) chain that resolves `rows`. */
function mockSelect(rows: FakeRow[]) {
  const select = vi.fn()
  const from = vi.fn()
  const where = vi.fn()
  const limit = vi.fn().mockResolvedValue(rows)
  select.mockReturnValue({ from })
  from.mockReturnValue({ where })
  where.mockReturnValue({ limit })
  return { select, limit }
}

/**
 * Builds a db.insert().values().returning() chain that resolves `rows` and
 * captures the values passed to `.values()` for later assertions.
 */
function mockInsert(rows: FakeRow[]) {
  const insert = vi.fn()
  const values = vi.fn()
  const returning = vi.fn().mockResolvedValue(rows)
  insert.mockReturnValue({ values })
  values.mockImplementation((v: unknown) => {
    capturedInsertValues.push(v)
    return { returning }
  })
  return { insert, returning }
}

describe("trackConversion", () => {
  let clickRows: FakeRow[]
  let productRows: FakeRow[]
  let existingRows: FakeRow[]
  let insertedRows: FakeRow[]
  let mockDb: Database
  let mockIsUuid: ReturnType<typeof vi.fn>

  const validTid = "00000000-0000-0000-0000-000000000000"

  beforeEach(() => {
    clickRows = []
    productRows = []
    existingRows = []
    insertedRows = []
    capturedInsertValues = []

    // Both the click lookup and the product lookup go through db.select() in
    // that order, so a single chain resolves click rows first, then product
    // rows. Inside the transaction, tx.select() resolves the dedup check and
    // tx.insert().values().returning() resolves the inserted conversion.
    const existingSelect = mockSelect(existingRows)
    const insertChain = mockInsert(insertedRows)

    const select = vi.fn()
    const from = vi.fn()
    const where = vi.fn()
    const limit = vi
      .fn()
      .mockResolvedValueOnce(clickRows)
      .mockResolvedValueOnce(productRows)
    select.mockReturnValue({ from })
    from.mockReturnValue({ where })
    where.mockReturnValue({ limit })

    const tx = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: existingSelect.select,
      insert: insertChain.insert,
    }

    mockDb = {
      select,
      transaction: vi.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
    } as unknown as Database

    mockIsUuid = isUuid as unknown as ReturnType<typeof vi.fn>
    mockIsUuid.mockReturnValue(true)
  })

  it("returns failure when tid is not a valid UUID", async () => {
    mockIsUuid.mockReturnValue(false)

    const result = await trackConversion(mockDb, { tid: "not-a-uuid" })

    expect(result).toEqual({ success: false, error: "Click not found" })
  })

  it("returns failure when no click matches the tid", async () => {
    const result = await trackConversion(mockDb, { tid: validTid })

    expect(result).toEqual({ success: false, error: "Click not found" })
  })

  it("returns failure when the product is not found", async () => {
    clickRows.push({ id: "click_1", productId: "prod_1" })

    const result = await trackConversion(mockDb, { tid: validTid })

    expect(result).toEqual({ success: false, error: "Product not found or inactive" })
  })

  it("returns failure when the product is not active", async () => {
    clickRows.push({ id: "click_1", productId: "prod_1" })
    productRows.push({ id: "prod_1", status: "inactive" })

    const result = await trackConversion(mockDb, { tid: validTid })

    expect(result).toEqual({ success: false, error: "Product not found or inactive" })
  })

  it("inserts a conversion with resolved payout, event, and status", async () => {
    clickRows.push({ id: "click_1", productId: "prod_1" })
    productRows.push({
      id: "prod_1",
      status: "active",
      defaultPayout: "2.50",
      defaultRevenue: "5.00",
      currency: "USD",
    })
    insertedRows.push({ id: "cnv_test123" })

    const result = await trackConversion(mockDb, {
      tid: validTid,
      event: "purchase",
      ipAddress: "1.2.3.4",
    })

    expect(result).toEqual({
      success: true,
      isDuplicate: false,
      conversionId: "cnv_test123",
    })
    expect(generateId).toHaveBeenCalledWith("conversion")
    expect(encryptPII).toHaveBeenCalledWith("1.2.3.4")

    // Verify the values the service actually wrote to the conversions table.
    const inserted = capturedInsertValues[0] as Record<string, unknown>
    expect(inserted).toMatchObject({
      clickId: "click_1",
      event: "purchase",
      payout: "2.50",
      revenue: "5.00",
      currency: "USD",
      status: CONVERSION_STATUS.PENDING,
      method: "pixel",
      ipEncrypted: "encrypted-base64",
    })
  })

  it("returns isDuplicate=true when a conversion already exists", async () => {
    clickRows.push({ id: "click_1", productId: "prod_1" })
    productRows.push({ id: "prod_1", status: "active" })
    existingRows.push({ id: "existing_cnv" })

    const result = await trackConversion(mockDb, { tid: validTid })

    expect(result).toEqual({
      success: true,
      isDuplicate: true,
      conversionId: "existing_cnv",
    })
  })

  it("continues without PII encryption when encryption fails (fail-open)", async () => {
    clickRows.push({ id: "click_1", productId: "prod_1" })
    productRows.push({ id: "prod_1", status: "active" })
    insertedRows.push({ id: "cnv_test123" })
    ;(encryptPII as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("no key")
    )

    const result = await trackConversion(mockDb, {
      tid: validTid,
      ipAddress: "1.2.3.4",
    })

    expect(result.success).toBe(true)
  })

  it("defaults the event to 'conversion'", async () => {
    clickRows.push({ id: "click_1", productId: "prod_1" })
    productRows.push({ id: "prod_1", status: "active", currency: "USD" })
    insertedRows.push({ id: "cnv_test123" })

    const result = await trackConversion(mockDb, { tid: validTid })

    expect(result.success).toBe(true)
    expect(result.conversionId).toBe("cnv_test123")
    expect(capturedInsertValues[0]).toMatchObject({ event: "conversion" })
  })

  it("uses the caller-provided payout over the product default", async () => {
    clickRows.push({ id: "click_1", productId: "prod_1" })
    productRows.push({
      id: "prod_1",
      status: "active",
      defaultPayout: "2.50",
      currency: "USD",
    })
    insertedRows.push({ id: "cnv_test123" })

    await trackConversion(mockDb, { tid: validTid, payout: "9.99" })

    expect(capturedInsertValues[0]).toMatchObject({ payout: "9.99" })
  })
})
