import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { getInitials, getStatusVariant } from "./utils"
import { EMPLOYEE_STATUS, EMPLOYEE_STATUS_VALUES } from "@adscrush/shared/constants/status"

// ---------------------------------------------------------------------------
// Unit tests: getInitials edge cases
// Task 1.3 — Requirements: 1.2
// ---------------------------------------------------------------------------

describe("getInitials", () => {
  it("returns empty string for empty input", () => {
    expect(getInitials("")).toBe("")
  })

  it("returns empty string for blank/whitespace-only input", () => {
    expect(getInitials("   ")).toBe("")
    expect(getInitials("\t")).toBe("")
  })

  it("returns single uppercase character for a single word", () => {
    expect(getInitials("Alice")).toBe("A")
    expect(getInitials("bob")).toBe("B")
  })

  it("returns two uppercase characters for two words", () => {
    expect(getInitials("Alice Smith")).toBe("AS")
    expect(getInitials("john doe")).toBe("JD")
  })

  it("returns only the first two initials for names with more than two words", () => {
    expect(getInitials("Alice Marie Smith")).toBe("AM")
    expect(getInitials("a b c d e")).toBe("AB")
  })

  it("handles extra whitespace between words", () => {
    expect(getInitials("  Alice   Smith  ")).toBe("AS")
  })

  it("handles tab-separated words", () => {
    expect(getInitials("Alice\tSmith")).toBe("AS")
  })
})

// ---------------------------------------------------------------------------
// Unit tests: getStatusVariant
// ---------------------------------------------------------------------------

describe("getStatusVariant", () => {
  it("returns 'success' for APPROVED status", () => {
    expect(getStatusVariant(EMPLOYEE_STATUS.APPROVED)).toBe("success")
  })

  it("returns 'warning' for PENDING status", () => {
    expect(getStatusVariant(EMPLOYEE_STATUS.PENDING)).toBe("warning")
  })

  it("returns 'destructive' for REJECTED status", () => {
    expect(getStatusVariant(EMPLOYEE_STATUS.REJECTED)).toBe("destructive")
  })

  it("returns 'secondary' for unknown status", () => {
    expect(getStatusVariant("unknown")).toBe("secondary")
    expect(getStatusVariant("")).toBe("secondary")
    expect(getStatusVariant("active")).toBe("secondary")
  })
})

// ---------------------------------------------------------------------------
// Property 1: Initials Derivation Correctness
// Task 1.1 — Validates: Requirements 1.2
// ---------------------------------------------------------------------------

describe("Property 1: Initials Derivation Correctness", () => {
  it("result length is at most 2 for any non-empty name", () => {
    fc.assert(
      fc.property(
        // Generate strings with at least one non-whitespace character
        fc.stringMatching(/\S/),
        (name) => {
          const result = getInitials(name)
          expect(result.length).toBeLessThanOrEqual(2)
        }
      ),
      { numRuns: 200 }
    )
  })

  it("every character in the result is uppercase", () => {
    fc.assert(
      fc.property(fc.stringMatching(/\S/), (name) => {
        const result = getInitials(name)
        for (const char of result) {
          expect(char).toBe(char.toUpperCase())
        }
      }),
      { numRuns: 200 }
    )
  })

  it("each character in the result is the first letter of a word in the input", () => {
    fc.assert(
      fc.property(fc.stringMatching(/\S/), (name) => {
        const result = getInitials(name)
        const words = name.trim().split(/\s+/).filter(Boolean)
        const firstLetters = words.map((w) => w[0]!.toUpperCase())

        for (let i = 0; i < result.length; i++) {
          expect(firstLetters).toContain(result[i])
          // More precisely: result[i] must be the first letter of words[i]
          expect(result[i]).toBe(firstLetters[i]!)
        }
      }),
      { numRuns: 200 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 2: Status Badge Variant Completeness
// Task 1.2 — Validates: Requirements 1.6, 1.7, 1.8, 1.9, 1.10
// ---------------------------------------------------------------------------

describe("Property 2: Status Badge Variant Completeness", () => {
  it("returns a non-empty string for every known EMPLOYEE_STATUS value", () => {
    for (const status of EMPLOYEE_STATUS_VALUES) {
      const variant = getStatusVariant(status)
      expect(typeof variant).toBe("string")
      expect(variant.length).toBeGreaterThan(0)
    }
  })
})
