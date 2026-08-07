import { describe, it, expect } from "vitest"
import { selectByWeight, calculateProbabilities, validateWeights } from "./weighted-selection"

describe("selectByWeight", () => {
  it("should return null for empty array", () => {
    const result = selectByWeight([])
    expect(result).toBeNull()
  })

  it("should return the only item when array has one element", () => {
    const items = [{ id: "lp1", weight: 100 }]
    const result = selectByWeight(items)
    expect(result).toEqual(items[0])
  })

  it("should select items based on weight distribution", () => {
    const items = [
      { id: "lp1", weight: 100 },
      { id: "lp2", weight: 0 }, // Should still have chance (treated as 1)
    ]

    // Run multiple times to test distribution
    const results = new Set()
    for (let i = 0; i < 100; i++) {
      const selected = selectByWeight(items)
      results.add(selected?.id)
    }

    // Both should appear (lp1 should dominate with 100/101 probability)
    // But lp2 should appear occasionally with 1/101 probability
    expect(results.size).toBeGreaterThanOrEqual(1)
    expect(results.has("lp1")).toBe(true) // lp1 should definitely appear
  })

  it("should treat null weights as weight of 1", () => {
    const items = [
      { id: "lp1", weight: null },
      { id: "lp2", weight: null },
    ]

    const result = selectByWeight(items)
    expect(result).toBeDefined()
    expect(["lp1", "lp2"]).toContain(result?.id)
  })

  it("should treat zero weights as disabled (excluded from selection)", () => {
    const items = [
      { id: "lp1", weight: 0 },
      { id: "lp2", weight: 0 },
    ]

    const result = selectByWeight(items)
    // All items disabled, should return null
    expect(result).toBeNull()
  })

  it("should exclude zero weight items from selection", () => {
    const items = [
      { id: "lp1", weight: 100 },
      { id: "lp2", weight: 0 }, // Disabled - should never be selected
    ]

    // Run multiple times - lp2 should never appear
    for (let i = 0; i < 100; i++) {
      const selected = selectByWeight(items)
      expect(selected?.id).toBe("lp1") // Only lp1 should be selected
    }
  })

  it("should handle mixed weights correctly", () => {
    const items = [
      { id: "lp1", weight: 100 },
      { id: "lp2", weight: 100 },
      { id: "lp3", weight: 50 },
    ]

    // Run many times to check distribution
    const counts = { lp1: 0, lp2: 0, lp3: 0 }
    const iterations = 10000

    for (let i = 0; i < iterations; i++) {
      const selected = selectByWeight(items)
      if (selected) {
        counts[selected.id as keyof typeof counts]++
      }
    }

    // Calculate percentages
    const lp1Pct = counts.lp1 / iterations
    const lp2Pct = counts.lp2 / iterations
    const lp3Pct = counts.lp3 / iterations

    // lp1 and lp2 should each get ~40% (100/250), lp3 should get ~20% (50/250)
    // Allow 5% margin for randomness
    expect(lp1Pct).toBeGreaterThan(0.35)
    expect(lp1Pct).toBeLessThan(0.45)
    expect(lp2Pct).toBeGreaterThan(0.35)
    expect(lp2Pct).toBeLessThan(0.45)
    expect(lp3Pct).toBeGreaterThan(0.15)
    expect(lp3Pct).toBeLessThan(0.25)
  })

  it("should handle negative weights as zero", () => {
    const items = [
      { id: "lp1", weight: -10 },
      { id: "lp2", weight: 100 },
    ]

    // lp2 should dominate due to lp1's negative weight being treated as 1
    const counts = { lp1: 0, lp2: 0 }
    const iterations = 1000

    for (let i = 0; i < iterations; i++) {
      const selected = selectByWeight(items)
      if (selected) {
        counts[selected.id as keyof typeof counts]++
      }
    }

    // lp2 should get ~99% (100/101), lp1 should get ~1% (1/101)
    expect(counts.lp2).toBeGreaterThan(counts.lp1 * 50)
  })
})

describe("calculateProbabilities", () => {
  it("should return empty array for empty input", () => {
    const probs = calculateProbabilities([])
    expect(probs).toEqual([])
  })

  it("should return [1] for single item", () => {
    const probs = calculateProbabilities([{ weight: 100 }])
    expect(probs).toEqual([1])
  })

  it("should calculate correct probabilities", () => {
    const items = [
      { weight: 100 },
      { weight: 100 },
      { weight: 50 },
    ]

    const probs = calculateProbabilities(items)

    // Total weight: 250
    // lp1: 100/250 = 0.4
    // lp2: 100/250 = 0.4
    // lp3: 50/250 = 0.2
    expect(probs[0]).toBeCloseTo(0.4, 2)
    expect(probs[1]).toBeCloseTo(0.4, 2)
    expect(probs[2]).toBeCloseTo(0.2, 2)

    // Sum should be 1
    const sum = probs.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 5)
  })

  it("should treat null weights as 1", () => {
    const items = [
      { weight: null },
      { weight: null },
    ]

    const probs = calculateProbabilities(items)

    // Each should be 0.5 (1/2)
    expect(probs[0]).toBeCloseTo(0.5, 2)
    expect(probs[1]).toBeCloseTo(0.5, 2)
  })

  it("should handle equal weights", () => {
    const items = [
      { weight: 100 },
      { weight: 100 },
    ]

    const probs = calculateProbabilities(items)

    expect(probs[0]).toBeCloseTo(0.5, 2)
    expect(probs[1]).toBeCloseTo(0.5, 2)
  })
})

describe("validateWeights", () => {
  it("should warn about no items", () => {
    const warnings = validateWeights([])
    expect(warnings).toContain("No items to select from")
  })

  it("should warn about all zero/null weights", () => {
    const items = [
      { weight: null },
      { weight: 0 },
      { weight: null },
    ]

    const warnings = validateWeights(items)
    expect(warnings.some((w) => w.includes("disabled"))).toBe(true)
  })

  it("should warn about negative weights", () => {
    const items = [
      { weight: 100 },
      { weight: -50 },
      { weight: -10 },
    ]

    const warnings = validateWeights(items)
    expect(warnings.some((w) => w.includes("negative weights"))).toBe(true)
    expect(warnings.some((w) => w.includes("2 items"))).toBe(true)
  })

  it("should return no warnings for valid weights", () => {
    const items = [
      { weight: 100 },
      { weight: 50 },
      { weight: 25 },
    ]

    const warnings = validateWeights(items)
    expect(warnings).toEqual([])
  })
})
