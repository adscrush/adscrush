import { describe, it, expect } from "vitest"
import {
  isValidLeadStatus,
  getValidLeadStatuses,
  validateStatus,
  validateTransition,
  validateTimeWindow,
  isAlreadyInStatus,
  validateAll,
  buildStatusUpdatePayload,
} from "./lead-status"

// ─── isValidLeadStatus ───────────────────────────────────────────────────────

describe("isValidLeadStatus", () => {
  it("returns true for valid statuses", () => {
    expect(isValidLeadStatus("pending")).toBe(true)
    expect(isValidLeadStatus("approved")).toBe(true)
    expect(isValidLeadStatus("rejected")).toBe(true)
  })

  it("returns false for invalid statuses", () => {
    expect(isValidLeadStatus("")).toBe(false)
    expect(isValidLeadStatus("unknown")).toBe(false)
    expect(isValidLeadStatus("PENDING")).toBe(false)
    expect(isValidLeadStatus("chargeback")).toBe(false)
  })
})

// ─── getValidLeadStatuses ────────────────────────────────────────────────────

describe("getValidLeadStatuses", () => {
  it("returns all valid statuses", () => {
    const statuses = getValidLeadStatuses()
    expect(statuses).toHaveLength(3)
    expect(statuses).toContain("pending")
    expect(statuses).toContain("approved")
    expect(statuses).toContain("rejected")
  })
})

// ─── validateStatus ──────────────────────────────────────────────────────────

describe("validateStatus", () => {
  it("returns valid for known status", () => {
    expect(validateStatus("pending")).toEqual({ valid: true })
    expect(validateStatus("approved")).toEqual({ valid: true })
    expect(validateStatus("rejected")).toEqual({ valid: true })
  })

  it("returns invalid for unknown status", () => {
    const result = validateStatus("unknown")
    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe("INVALID_STATUS")
  })
})

// ─── validateTransition ──────────────────────────────────────────────────────

describe("validateTransition", () => {
  it("allows pending → approved", () => {
    expect(validateTransition("pending", "approved")).toEqual({ valid: true })
  })

  it("allows pending → rejected", () => {
    expect(validateTransition("pending", "rejected")).toEqual({ valid: true })
  })

  it("allows approved → rejected (chargeback)", () => {
    expect(validateTransition("approved", "rejected")).toEqual({ valid: true })
  })

  it("rejects approved → pending", () => {
    const result = validateTransition("approved", "pending")
    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe("INVALID_TRANSITION")
  })

  it("rejects rejected → anything (terminal state)", () => {
    const result = validateTransition("rejected", "pending")
    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe("INVALID_TRANSITION")
  })

  it("rejects rejected → approved", () => {
    const result = validateTransition("rejected", "approved")
    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe("INVALID_TRANSITION")
  })
})

// ─── validateTimeWindow ──────────────────────────────────────────────────────

describe("validateTimeWindow", () => {
  it("passes for a lead created just now", () => {
    const result = validateTimeWindow(new Date())
    expect(result.valid).toBe(true)
  })

  it("passes for a lead created 29 days ago", () => {
    const past = new Date()
    past.setDate(past.getDate() - 29)
    expect(validateTimeWindow(past).valid).toBe(true)
  })

  it("fails for a lead created 31 days ago", () => {
    const past = new Date()
    past.setDate(past.getDate() - 31)
    const result = validateTimeWindow(past)
    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe("LEAD_EXPIRED")
  })

  it("respects custom maxDays", () => {
    const past = new Date()
    past.setDate(past.getDate() - 5)
    expect(validateTimeWindow(past, 7).valid).toBe(true)
    expect(validateTimeWindow(past, 3).valid).toBe(false)
  })
})

// ─── isAlreadyInStatus ───────────────────────────────────────────────────────

describe("isAlreadyInStatus", () => {
  it("returns true when statuses match", () => {
    expect(isAlreadyInStatus("pending", "pending")).toBe(true)
    expect(isAlreadyInStatus("approved", "approved")).toBe(true)
  })

  it("returns false when statuses differ", () => {
    expect(isAlreadyInStatus("pending", "approved")).toBe(false)
    expect(isAlreadyInStatus("approved", "rejected")).toBe(false)
  })
})

// ─── validateAll ─────────────────────────────────────────────────────────────

describe("validateAll", () => {
  it("passes for valid transition within time window", () => {
    const result = validateAll({
      currentStatus: "pending",
      requestedStatus: "approved",
      createdAt: new Date(),
    })
    expect(result.valid).toBe(true)
  })

  it("fails for invalid status", () => {
    const result = validateAll({
      currentStatus: "pending",
      requestedStatus: "unknown",
      createdAt: new Date(),
    })
    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe("INVALID_STATUS")
  })

  it("fails for invalid transition", () => {
    const result = validateAll({
      currentStatus: "approved",
      requestedStatus: "pending",
      createdAt: new Date(),
    })
    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe("INVALID_TRANSITION")
  })

  it("fails for expired lead", () => {
    const past = new Date()
    past.setDate(past.getDate() - 31)
    const result = validateAll({
      currentStatus: "pending",
      requestedStatus: "approved",
      createdAt: past,
    })
    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe("LEAD_EXPIRED")
  })
})

// ─── buildStatusUpdatePayload ────────────────────────────────────────────────

describe("buildStatusUpdatePayload", () => {
  it("builds approval payload with status and timestamp", () => {
    const payload = buildStatusUpdatePayload(
      {
        currentStatus: "pending",
        requestedStatus: "approved",
        createdAt: new Date(),
      },
      "user_123",
    )
    expect(payload.status).toBe("approved")
    expect(payload.statusUpdatedBy).toBe("user_123")
    expect(payload.statusUpdatedAt).toBeInstanceOf(Date)
    expect(payload.payout).toBeUndefined()
    expect(payload.rejectionReason).toBeUndefined()
  })

  it("includes payout override on approval", () => {
    const payload = buildStatusUpdatePayload(
      {
        currentStatus: "pending",
        requestedStatus: "approved",
        createdAt: new Date(),
        payout: "50.00",
      },
      "user_123",
    )
    expect(payload.status).toBe("approved")
    expect(payload.payout).toBe("50.00")
  })

  it("includes currency override on approval", () => {
    const payload = buildStatusUpdatePayload(
      {
        currentStatus: "pending",
        requestedStatus: "approved",
        createdAt: new Date(),
        currency: "EUR",
      },
      "user_123",
    )
    expect(payload.currency).toBe("EUR")
  })

  it("builds rejection payload with default payout and reason", () => {
    const payload = buildStatusUpdatePayload(
      {
        currentStatus: "pending",
        requestedStatus: "rejected",
        createdAt: new Date(),
      },
      "user_123",
    )
    expect(payload.status).toBe("rejected")
    expect(payload.payout).toBe("0")
    expect(payload.rejectionReason).toBe("Rejected via status update")
  })

  it("includes custom rejection reason", () => {
    const payload = buildStatusUpdatePayload(
      {
        currentStatus: "pending",
        requestedStatus: "rejected",
        createdAt: new Date(),
        rejectionReason: "Invalid lead data",
      },
      "user_123",
    )
    expect(payload.rejectionReason).toBe("Invalid lead data")
  })

  it("includes negative payout on rejection for chargeback", () => {
    const payload = buildStatusUpdatePayload(
      {
        currentStatus: "approved",
        requestedStatus: "rejected",
        createdAt: new Date(),
        payout: "-25.00",
      },
      "user_123",
    )
    expect(payload.payout).toBe("-25.00")
  })
})