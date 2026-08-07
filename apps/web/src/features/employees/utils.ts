import { EMPLOYEE_STATUS } from "@adscrush/shared/constants/status"

/**
 * Derives initials from a full name string.
 * Takes the first character of each whitespace-separated word, uppercases it,
 * and returns at most 2 characters. Returns "" for empty/blank input.
 */
export function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ""

  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}

/**
 * Maps an employee status string to a Badge variant string.
 * - APPROVED → "success"
 * - PENDING  → "warning"
 * - REJECTED → "destructive"
 * - anything else → "secondary"
 */
const STATUS_BADGE_VARIANT: Record<string, string> = {
  [EMPLOYEE_STATUS.APPROVED]: "success",
  [EMPLOYEE_STATUS.PENDING]: "warning",
  [EMPLOYEE_STATUS.REJECTED]: "destructive",
}

export function getStatusVariant(status: string): string {
  return STATUS_BADGE_VARIANT[status] ?? "secondary"
}

/**
 * Dialog open/close state for the Employee Details page.
 */
export type DialogState = {
  edit: boolean
  changePassword: boolean
  ban: boolean
  impersonate: boolean
}

/**
 * Tab definitions for the Employee Details tabbed layout.
 */
export const TABS = [
  { value: "info", label: "Info" },
  { value: "access", label: "Access" },
] as const

export type TabValue = (typeof TABS)[number]["value"]
