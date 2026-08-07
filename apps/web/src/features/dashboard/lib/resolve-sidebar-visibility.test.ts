import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { buildSidebarVisibility, can } from "./resolve-sidebar-visibility"
import {
  ALL_PERMISSION_KEYS,
  type Permission,
} from "@adscrush/shared/constants/permissions"
import { ALL_ROLES } from "@adscrush/shared/constants/roles"
import { ALL_NAV_GATE_PERMISSIONS } from "../config/sidebar-nav-config"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All gate permissions declared in the nav config — the only ones we test. */
const GATE_KEYS = [...ALL_NAV_GATE_PERMISSIONS] as Permission[]

// ---------------------------------------------------------------------------
// Property 1: Admin bypass always produces all-visible config
// Feature: sidebar-permission-based-visibility, Property 1: Admin bypass always produces all-visible config
// Validates: Requirements 1.3, 4.1, 4.3
// ---------------------------------------------------------------------------

describe("Property 1: Admin bypass always produces all-visible config", () => {
  it("every gate permission is true for admin/super_admin regardless of permissions", () => {
    // Feature: sidebar-permission-based-visibility, Property 1: Admin bypass always produces all-visible config
    fc.assert(
      fc.property(
        fc.constantFrom("admin" as const, "super_admin" as const),
        fc.array(fc.constantFrom(...ALL_PERMISSION_KEYS)),
        (role, permissions) => {
          const config = buildSidebarVisibility(role, permissions)
          for (const gate of GATE_KEYS) {
            expect(can(config, gate)).toBe(true)
          }
        },
      ),
      { numRuns: 200 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 2: Employee visibility exactly mirrors gate-permission membership
// Feature: sidebar-permission-based-visibility, Property 2: Employee visibility exactly mirrors gate-permission membership
// Validates: Requirements 1.4, 3.1–3.7
// ---------------------------------------------------------------------------

describe("Property 2: Employee visibility exactly mirrors gate-permission membership", () => {
  it("can(config, gate) === permissions.includes(gate) for role employee", () => {
    // Feature: sidebar-permission-based-visibility, Property 2: Employee visibility exactly mirrors gate-permission membership
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...ALL_PERMISSION_KEYS)),
        (permissions) => {
          const config = buildSidebarVisibility("employee", permissions)
          for (const gate of GATE_KEYS) {
            expect(can(config, gate)).toBe(permissions.includes(gate))
          }
        },
      ),
      { numRuns: 200 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 3: All gate fields are strictly boolean
// Feature: sidebar-permission-based-visibility, Property 3: All fields are strictly boolean
// Validates: Requirements 5.4
// ---------------------------------------------------------------------------

describe("Property 3: All gate fields are strictly boolean", () => {
  it("can() returns true or false — never undefined, null, 0, etc.", () => {
    // Feature: sidebar-permission-based-visibility, Property 3: All fields are strictly boolean
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROLES),
        fc.array(fc.constantFrom(...ALL_PERMISSION_KEYS)),
        (role, permissions) => {
          const config = buildSidebarVisibility(role, permissions)
          for (const gate of GATE_KEYS) {
            const result = can(config, gate)
            expect(typeof result).toBe("boolean")
            expect(result === true || result === false).toBe(true)
          }
        },
      ),
      { numRuns: 200 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 4: Admin config equals full-permission employee config
// Feature: sidebar-permission-based-visibility, Property 4: Admin config deep-equals full-permission employee config
// Validates: Requirements 4.3
// ---------------------------------------------------------------------------

describe("Property 4: Admin config deep-equals full-permission employee config (excluding role)", () => {
  it("buildSidebarVisibility('admin', []) matches full-permission employee config for all gate permissions", () => {
    // Feature: sidebar-permission-based-visibility, Property 4: Admin config deep-equals full-permission employee config
    // Note: the `role` property differs (admin vs employee), so we compare only the permission gates.
    const adminConfig = buildSidebarVisibility("admin", [])
    const fullEmployeeConfig = buildSidebarVisibility("employee", ALL_PERMISSION_KEYS)
    for (const gate of GATE_KEYS) {
      expect(adminConfig[gate]).toBe(fullEmployeeConfig[gate])
    }
  })

  it("buildSidebarVisibility('super_admin', []) matches full-permission employee config for all gate permissions", () => {
    // Feature: sidebar-permission-based-visibility, Property 4: Admin config deep-equals full-permission employee config
    const superAdminConfig = buildSidebarVisibility("super_admin", [])
    const fullEmployeeConfig = buildSidebarVisibility("employee", ALL_PERMISSION_KEYS)
    for (const gate of GATE_KEYS) {
      expect(superAdminConfig[gate]).toBe(fullEmployeeConfig[gate])
    }
  })
})

// ---------------------------------------------------------------------------
// Property 5: can() with null permission always returns true
// ---------------------------------------------------------------------------

describe("Property 5: can() with null permission always returns true", () => {
  it("items with no gate are always visible regardless of role or permissions", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROLES),
        fc.array(fc.constantFrom(...ALL_PERMISSION_KEYS)),
        (role, permissions) => {
          const config = buildSidebarVisibility(role, permissions)
          expect(can(config, null)).toBe(true)
        },
      ),
      { numRuns: 200 },
    )
  })
})

// ---------------------------------------------------------------------------
// Example-based unit tests
// ---------------------------------------------------------------------------

describe("buildSidebarVisibility — example-based unit tests", () => {
  it("employee with no permissions → all gate permissions false", () => {
    const config = buildSidebarVisibility("employee", [])
    for (const gate of GATE_KEYS) {
      expect(can(config, gate)).toBe(false)
    }
  })

  it("employee with only employees.view → only that gate is true", () => {
    const config = buildSidebarVisibility("employee", ["employees.view"])
    expect(can(config, "employees.view")).toBe(true)
    for (const gate of GATE_KEYS.filter((g) => g !== "employees.view")) {
      expect(can(config, gate)).toBe(false)
    }
  })

  it("employee with ALL_PERMISSION_KEYS → all gate permissions true", () => {
    const config = buildSidebarVisibility("employee", ALL_PERMISSION_KEYS)
    for (const gate of GATE_KEYS) {
      expect(can(config, gate)).toBe(true)
    }
  })

  it("can() with null permission always returns true", () => {
    const config = buildSidebarVisibility("employee", [])
    expect(can(config, null)).toBe(true)
  })
})
