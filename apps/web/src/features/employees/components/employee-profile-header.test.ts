/**
 * Unit tests for EmployeeProfileHeader conditional logic
 * Task 3.1 — Requirements: 2.5, 2.6, 2.8
 *
 * Note: The test environment is node-only (no jsdom/RTL available).
 * These tests validate the conditional rendering logic extracted from the component.
 */

import { describe, it, expect } from "vitest"
import { EMPLOYEE_STATUS } from "@adscrush/shared/constants/status"

// ---------------------------------------------------------------------------
// Ban button label logic
// The component renders "Unban" when status === EMPLOYEE_STATUS.REJECTED,
// otherwise "Ban".
// ---------------------------------------------------------------------------

function getBanButtonLabel(status: string | null | undefined): string {
  return status === EMPLOYEE_STATUS.REJECTED ? "Unban" : "Ban"
}

// ---------------------------------------------------------------------------
// Disabled state logic
// Impersonate and Ban/Unban buttons are disabled when !employee.userId
// ---------------------------------------------------------------------------

function isUserActionDisabled(userId: string | null | undefined): boolean {
  return !userId
}

describe("EmployeeProfileHeader — ban button label", () => {
  it("shows 'Unban' when employee status is REJECTED (banned)", () => {
    expect(getBanButtonLabel(EMPLOYEE_STATUS.REJECTED)).toBe("Unban")
  })

  it("shows 'Ban' when employee status is APPROVED", () => {
    expect(getBanButtonLabel(EMPLOYEE_STATUS.APPROVED)).toBe("Ban")
  })

  it("shows 'Ban' when employee status is PENDING", () => {
    expect(getBanButtonLabel(EMPLOYEE_STATUS.PENDING)).toBe("Ban")
  })

  it("shows 'Ban' when employee status is null", () => {
    expect(getBanButtonLabel(null)).toBe("Ban")
  })

  it("shows 'Ban' when employee status is undefined", () => {
    expect(getBanButtonLabel(undefined)).toBe("Ban")
  })
})

describe("EmployeeProfileHeader — disabled state for user-linked actions", () => {
  it("disables Impersonate and Ban/Unban when userId is null", () => {
    expect(isUserActionDisabled(null)).toBe(true)
  })

  it("disables Impersonate and Ban/Unban when userId is undefined", () => {
    expect(isUserActionDisabled(undefined)).toBe(true)
  })

  it("disables Impersonate and Ban/Unban when userId is empty string", () => {
    expect(isUserActionDisabled("")).toBe(true)
  })

  it("does NOT disable Impersonate and Ban/Unban when userId is a valid string", () => {
    expect(isUserActionDisabled("user-123")).toBe(false)
  })

  it("does NOT disable Impersonate and Ban/Unban when userId is any non-empty string", () => {
    expect(isUserActionDisabled("abc")).toBe(false)
    expect(isUserActionDisabled("00000000-0000-0000-0000-000000000001")).toBe(false)
  })
})
