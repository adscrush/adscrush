import { describe, it, expect } from "vitest"
import { getRevenueSeriesConfig, backfillRevenueSeries } from "../dashboard-helpers"

describe("getRevenueSeriesConfig", () => {
  it("returns daily mode for Today (1 day range)", () => {
    const now = new Date("2026-08-02T12:00:00Z")
    const today = new Date("2026-08-02T00:00:00Z")
    const result = getRevenueSeriesConfig(today, now, 0)

    expect(result.isDailyRevenue).toBe(true)
  })

  it("returns daily mode for Last 7 Days", () => {
    const now = new Date("2026-08-02T12:00:00Z")
    const sevenDaysAgo = new Date("2026-07-26T00:00:00Z")
    const result = getRevenueSeriesConfig(sevenDaysAgo, now, 0)

    expect(result.isDailyRevenue).toBe(true)
  })

  it("returns daily mode for Last 30 Days", () => {
    const now = new Date("2026-08-02T12:00:00Z")
    const thirtyDaysAgo = new Date("2026-07-03T00:00:00Z")
    const result = getRevenueSeriesConfig(thirtyDaysAgo, now, 0)

    expect(result.isDailyRevenue).toBe(true)
  })

  it("returns daily mode for exactly 31 days", () => {
    const now = new Date("2026-08-02T00:00:00Z")
    const thirtyOneDaysAgo = new Date("2026-07-02T00:00:00Z")
    const result = getRevenueSeriesConfig(thirtyOneDaysAgo, now, 0)

    expect(result.isDailyRevenue).toBe(true)
  })

  it("returns monthly mode for This Year (365 days)", () => {
    const now = new Date("2026-08-02T12:00:00Z")
    const startOfYear = new Date("2026-01-01T00:00:00Z")
    const result = getRevenueSeriesConfig(startOfYear, now, 0)

    expect(result.isDailyRevenue).toBe(false)
  })

  it("returns monthly mode for 32+ day range", () => {
    const now = new Date("2026-08-02T12:00:00Z")
    const thirtyTwoDaysAgo = new Date("2026-07-01T00:00:00Z")
    const result = getRevenueSeriesConfig(thirtyTwoDaysAgo, now, 0)

    expect(result.isDailyRevenue).toBe(false)
  })

  it("revenueDateFrom matches actual dateFrom in daily mode", () => {
    const now = new Date("2026-08-02T12:00:00Z")
    const dateFrom = new Date("2026-07-26T00:00:00Z")
    const result = getRevenueSeriesConfig(dateFrom, now, 0)

    // Should match the actual dateFrom, not month start
    expect(result.revenueDateFrom.getFullYear()).toBe(2026)
    expect(result.revenueDateFrom.getMonth()).toBe(6) // July (0-indexed)
    expect(result.revenueDateFrom.getDate()).toBe(26)
  })

  it("revenueDateFrom is 12 months ago in monthly mode", () => {
    const now = new Date("2026-08-02T12:00:00Z")
    const startOfYear = new Date("2026-01-01T00:00:00Z")
    const result = getRevenueSeriesConfig(startOfYear, now, 0)

    // new Date(2026, 7-11, 1) = new Date(2026, -4, 1) = September 2025
    expect(result.revenueDateFrom.getFullYear()).toBe(2025)
    expect(result.revenueDateFrom.getMonth()).toBe(8) // September 2025 (0-indexed)
    expect(result.revenueDateFrom.getDate()).toBe(1)
  })
})

describe("backfillRevenueSeries", () => {
  it("backfills only the selected date range (not always to today)", () => {
    const raw: Array<{ period: string | null; revenue: string | null; clicks: number | null; conversions: number | null }> = []
    const dateFrom = new Date("2026-08-01T00:00:00Z")
    const dateTo = new Date("2026-08-01T23:59:59Z")
    const result = backfillRevenueSeries(raw, true, dateFrom, dateTo, 0)

    // "Yesterday" should only have Aug 1, not Aug 2
    expect(result.length).toBe(1)
    expect(result[0]!.period).toBe("2026-08-01")
    expect(result[0]!.revenue).toBe(0)
  })

  it("backfills multi-day range correctly", () => {
    const raw: Array<{ period: string | null; revenue: string | null; clicks: number | null; conversions: number | null }> = []
    const dateFrom = new Date("2026-07-31T00:00:00Z")
    const dateTo = new Date("2026-08-02T23:59:59Z")
    const result = backfillRevenueSeries(raw, true, dateFrom, dateTo, 0)

    // Jul 31, Aug 1, Aug 2 = 3 days
    expect(result.length).toBe(3)
    expect(result[0]!.period).toBe("2026-07-31")
    expect(result[1]!.period).toBe("2026-08-01")
    expect(result[2]!.period).toBe("2026-08-02")
  })

  it("preserves existing daily data", () => {
    const raw = [
      { period: "2026-08-01", revenue: "100", clicks: 50, conversions: 5 },
    ]
    const dateFrom = new Date("2026-08-01T00:00:00Z")
    const dateTo = new Date("2026-08-02T23:59:59Z")
    const result = backfillRevenueSeries(raw, true, dateFrom, dateTo, 0)

    expect(result.length).toBe(2)
    expect(result[0]!.revenue).toBe(100)
    expect(result[1]!.revenue).toBe(0) // Aug 2 not in raw data
  })

  it("backfills monthly data with 12 months", () => {
    const raw: Array<{ period: string | null; revenue: string | null; clicks: number | null; conversions: number | null }> = []
    const dateFrom = new Date("2026-01-01T00:00:00Z")
    const dateTo = new Date("2026-08-02T12:00:00Z")
    const result = backfillRevenueSeries(raw, false, dateFrom, dateTo, 0)

    expect(result.length).toBe(12)
    expect(result[0]!.period).toContain("2025")
    expect(result[11]!.period).toContain("2026")
  })
})
