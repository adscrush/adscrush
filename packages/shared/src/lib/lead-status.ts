import {
  LEAD_STATUS,
  LEAD_STATUS_TRANSITIONS,
  LEAD_STATUS_MAX_AGE_DAYS,
  type LeadStatus,
} from "../constants/status"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LeadStatusUpdateInput {
  /** Current status of the lead (from DB) */
  currentStatus: string
  /** Requested new status */
  requestedStatus: string
  /** Lead creation timestamp (for age check) */
  createdAt: Date
  /** Optional payout override (only applied on approval) */
  payout?: string | null
  /** Optional currency override (only applied on approval) */
  currency?: string | null
  /** Optional rejection reason (only applied on rejection) */
  rejectionReason?: string | null
}

export interface LeadStatusUpdatePayload {
  status: LeadStatus
  statusUpdatedAt: Date
  statusUpdatedBy: string
  payout?: string
  currency?: string
  rejectionReason?: string | null
}

export type LeadStatusErrorCode =
  | "INVALID_STATUS"
  | "INVALID_TRANSITION"
  | "LEAD_EXPIRED"
  | "ALREADY_IN_STATUS"

export interface LeadStatusValidationResult {
  valid: boolean
  error?: {
    code: LeadStatusErrorCode
    message: string
  }
}

// ─── Validation Functions ────────────────────────────────────────────────────

/**
 * Check if a status string is a valid LeadStatus.
 */
export function isValidLeadStatus(status: string): status is LeadStatus {
  return Object.values(LEAD_STATUS).includes(status as LeadStatus)
}

/**
 * Get all valid lead status values.
 */
export function getValidLeadStatuses(): readonly string[] {
  return Object.values(LEAD_STATUS)
}

/**
 * Validate that the requested status is a known lead status value.
 */
export function validateStatus(requestedStatus: string): LeadStatusValidationResult {
  if (!isValidLeadStatus(requestedStatus)) {
    return {
      valid: false,
      error: {
        code: "INVALID_STATUS",
        message: `Invalid status. Must be one of: ${getValidLeadStatuses().join(", ")}`,
      },
    }
  }
  return { valid: true }
}

/**
 * Validate that the transition from currentStatus to requestedStatus is allowed.
 */
export function validateTransition(
  currentStatus: string,
  requestedStatus: string,
): LeadStatusValidationResult {
  const allowed = LEAD_STATUS_TRANSITIONS[currentStatus as LeadStatus]
  if (!allowed) {
    return {
      valid: false,
      error: {
        code: "INVALID_TRANSITION",
        message: `Cannot transition from "${currentStatus}" — no transitions defined for this status`,
      },
    }
  }
  if (!(allowed as readonly string[]).includes(requestedStatus)) {
    return {
      valid: false,
      error: {
        code: "INVALID_TRANSITION",
        message: `Cannot transition from "${currentStatus}" to "${requestedStatus}"`,
      },
    }
  }
  return { valid: true }
}

/**
 * Validate that the lead is within the allowed time window for status updates.
 */
export function validateTimeWindow(
  createdAt: Date,
  maxDays: number = LEAD_STATUS_MAX_AGE_DAYS,
): LeadStatusValidationResult {
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays > maxDays) {
    return {
      valid: false,
      error: {
        code: "LEAD_EXPIRED",
        message: `Status updates are only allowed within ${maxDays} days of lead creation`,
      },
    }
  }
  return { valid: true }
}

/**
 * Check if the lead is already in the requested status (no-op guard).
 */
export function isAlreadyInStatus(
  currentStatus: string,
  requestedStatus: string,
): boolean {
  return currentStatus === requestedStatus
}

/**
 * Run all validations together. Returns the first validation failure, or
 * `{ valid: true }` if all pass.
 */
export function validateAll(input: {
  currentStatus: string
  requestedStatus: string
  createdAt: Date
}): LeadStatusValidationResult {
  // 1. Valid status
  const statusCheck = validateStatus(input.requestedStatus)
  if (!statusCheck.valid) return statusCheck

  // 2. Valid transition
  const transitionCheck = validateTransition(input.currentStatus, input.requestedStatus)
  if (!transitionCheck.valid) return transitionCheck

  // 3. Time window
  const timeCheck = validateTimeWindow(input.createdAt)
  if (!timeCheck.valid) return timeCheck

  return { valid: true }
}

// ─── Update Payload Builder ──────────────────────────────────────────────────

/**
 * Build the update payload for a lead status change.
 *
 * Business rules:
 * - On approval: allow payout/currency override
 * - On rejection: set payout to 0 (or provided negative for chargeback),
 *   store rejection reason
 * - On any status change: record who updated it
 */
export function buildStatusUpdatePayload(
  input: LeadStatusUpdateInput,
  updatedBy: string,
): LeadStatusUpdatePayload {
  const { requestedStatus, payout, currency, rejectionReason } = input
  const status = requestedStatus as LeadStatus

  const payload: LeadStatusUpdatePayload = {
    status,
    statusUpdatedAt: new Date(),
    statusUpdatedBy: updatedBy,
  }

  if (status === LEAD_STATUS.APPROVED) {
    if (payout) payload.payout = payout
    if (currency) payload.currency = currency
  }

  if (status === LEAD_STATUS.REJECTED) {
    payload.payout = payout ?? "0"
    payload.rejectionReason = rejectionReason ?? "Rejected via status update"
  }

  return payload
}