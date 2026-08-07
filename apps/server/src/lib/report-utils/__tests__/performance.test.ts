import { describe, it, expect } from "vitest"
import { buildPerformanceResult } from "../performance"

describe("buildPerformanceResult", () => {
  it("calculates derived metrics correctly", () => {
    const result = buildPerformanceResult({
      id: "prod-1",
      name: "Product 1",
      clicks: 100,
      uniqueClicks: 80,
      conversions: 20,
      approvedConversions: 15,
      revenue: 500,
      payout: 200,
    })

    expect(result.id).toBe("prod-1")
    expect(result.name).toBe("Product 1")
    expect(result.clicks).toBe(100)
    expect(result.conversions).toBe(20)
    expect(result.approvedConversions).toBe(15)
    expect(result.revenue).toBe(500)
    expect(result.payout).toBe(200)
    expect(result.profit).toBe(300) // 500 - 200
    expect(result.cr).toBe(20)      // (20/100) * 100
    expect(result.rpc).toBe(5)      // 500/100
    expect(result.epc).toBe(2)      // 200/100
  })

  it("handles zero clicks without division errors", () => {
    const result = buildPerformanceResult({
      id: "prod-2",
      name: "Product 2",
      clicks: 0,
      uniqueClicks: 0,
      conversions: 0,
      approvedConversions: 0,
      revenue: 0,
      payout: 0,
    })

    expect(result.clicks).toBe(0)
    expect(result.cr).toBe(0)
    expect(result.rpc).toBe(0)
    expect(result.epc).toBe(0)
    expect(result.profit).toBe(0)
  })

  it("uses 'Unknown' for null names", () => {
    const result = buildPerformanceResult({
      id: "prod-3",
      name: null,
      clicks: 10,
      uniqueClicks: 5,
      conversions: 0,
      approvedConversions: 0,
      revenue: 0,
      payout: 0,
    })

    expect(result.name).toBe("Unknown")
  })

  it("handles string numeric values (from SQL)", () => {
    const result = buildPerformanceResult({
      id: "prod-4",
      name: "Product 4",
      clicks: "50" as unknown as number,
      uniqueClicks: "40" as unknown as number,
      conversions: "10" as unknown as number,
      approvedConversions: "8" as unknown as number,
      revenue: "250.50" as unknown as number,
      payout: "100.25" as unknown as number,
    })

    expect(result.clicks).toBe(50)
    expect(result.revenue).toBe(250.5)
    expect(result.payout).toBe(100.25)
    expect(result.profit).toBeCloseTo(150.25)
  })

  it("includes breakdown fields when breakdownBy is provided", () => {
    const result = buildPerformanceResult(
      {
        id: "prod-5",
        name: "Product 5",
        clicks: 100,
        uniqueClicks: 80,
        conversions: 10,
        approvedConversions: 8,
        revenue: 300,
        payout: 100,
        campaignName: "Campaign Alpha",
      },
      ["campaign"],
    )

    expect(result.campaignName).toBe("Campaign Alpha")
  })

  it("skips null breakdown fields (remains undefined)", () => {
    const result = buildPerformanceResult(
      {
        id: "prod-6",
        name: "Product 6",
        clicks: 100,
        uniqueClicks: 80,
        conversions: 10,
        approvedConversions: 8,
        revenue: 300,
        payout: 100,
        campaignName: null as unknown as string,
      },
      ["campaign"],
    )

    expect(result.campaignName).toBeUndefined()
  })

  it("skips undefined breakdown fields", () => {
    const result = buildPerformanceResult(
      {
        id: "prod-7",
        name: "Product 7",
        clicks: 100,
        uniqueClicks: 80,
        conversions: 10,
        approvedConversions: 8,
        revenue: 300,
        payout: 100,
      },
      ["campaign"],
    )

    expect(result.campaignName).toBeUndefined()
  })
})
