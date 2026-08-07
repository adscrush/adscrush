import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import {
  ALL_PERMISSION_ENTRIES,
  ALL_PERMISSION_KEYS,
  PERMISSION_PRESETS,
} from "./permissions"

/**
 * Property tests for the Permission Registry.
 *
 * Validates: Requirements 1.6, 6.2, 6.5, 6.6
 */

describe("Permission Registry", () => {
  /**
   * Property 1: Permission Registry Key Uniqueness
   *
   * For any two entries in ALL_PERMISSION_ENTRIES, their `key` values must be
   * distinct. No two entries share the same key string.
   *
   * Validates: Requirements 1.6
   */
  it("Property 1: all permission keys are unique (no duplicates)", () => {
    fc.assert(
      fc.property(fc.constant(ALL_PERMISSION_KEYS), (keys) => {
        return keys.length === new Set(keys).size
      }),
      { numRuns: 1 },
    )
  })

  /**
   * Property 2: Permission Entry Completeness
   *
   * For any entry in ALL_PERMISSION_ENTRIES, the entry must have all five
   * required fields: a non-empty `key`, a non-empty `label`, a non-empty
   * `module`, a non-empty `section`, and a boolean `isGate`.
   *
   * Validates: Requirements 1.3
   */
  it("Property 2: every entry has all five required non-empty fields", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_PERMISSION_ENTRIES), (entry) => {
        expect(typeof entry.key).toBe("string")
        expect(entry.key.length).toBeGreaterThan(0)

        expect(typeof entry.label).toBe("string")
        expect(entry.label.length).toBeGreaterThan(0)

        expect(typeof entry.module).toBe("string")
        expect(entry.module.length).toBeGreaterThan(0)

        expect(typeof entry.section).toBe("string")
        expect(entry.section.length).toBeGreaterThan(0)

        expect(typeof entry.isGate).toBe("boolean")

        return true
      }),
      { numRuns: ALL_PERMISSION_ENTRIES.length },
    )
  })

  /**
   * Property 10: Full Preset Completeness
   *
   * The `full` preset contains every key in the Permission_Registry. Adding a
   * new permission to the registry automatically includes it in `full` without
   * any manual update.
   *
   * Validates: Requirements 6.2, 6.5
   */
  it("Property 10: full preset contains every key in the registry", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_PERMISSION_KEYS), (key) => {
        return (PERMISSION_PRESETS["full"] ?? []).includes(key)
      }),
      { numRuns: ALL_PERMISSION_KEYS.length },
    )
  })

  /**
   * Property 11: Preset Keys Are Valid Registry Keys
   *
   * For any preset name in PERMISSION_PRESETS, every key in that preset exists
   * in ALL_PERMISSION_KEYS.
   *
   * Validates: Requirements 6.6
   */
  it("Property 11: every key in every preset is a valid registry key", () => {
    const presetNames = Object.keys(PERMISSION_PRESETS) as Array<
      keyof typeof PERMISSION_PRESETS
    >

    fc.assert(
      fc.property(fc.constantFrom(...presetNames), (presetName) => {
        const presetKeys = PERMISSION_PRESETS[presetName] ?? []
        return presetKeys.every((k) => (ALL_PERMISSION_KEYS as string[]).includes(k))
      }),
      { numRuns: presetNames.length },
    )
  })
})
