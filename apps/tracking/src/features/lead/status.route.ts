import { Elysia, t } from "elysia"
import { eq } from "@adscrush/db/drizzle"
import { getDatabase } from "../../config/database.js"
import { leads } from "@adscrush/db/schema"
import { createHash } from "node:crypto"
import { logger } from "../../lib/logger.js"
import env from "../../config/env.js"
import {
  validateAll,
  isAlreadyInStatus,
  buildStatusUpdatePayload,
} from "@adscrush/shared/lib/lead-status"
import type { LeadApiStatusCode } from "./lead.service.js"

const log = logger({ module: "lead-status" })

if (!env.LEAD_API_KEY) {
  log.warn("LEAD_API_KEY not configured — lead status endpoint is open to unauthenticated requests")
}

// ─── Input Schema ────────────────────────────────────────────────────────────

const LeadStatusBodySchema = t.Object({
  tid: t.String({ error: "tid is required" }),
  status: t.String({ error: "status is required" }),
  payout: t.Optional(t.String()),
  currency: t.Optional(t.String()),
  reason: t.Optional(t.String()),
})

// ─── Core Handler ────────────────────────────────────────────────────────────

async function handleLeadStatusUpdate(params: {
  tid: string
  status: string
  payout?: string
  currency?: string
  reason?: string
  request: Request
}): Promise<{ status: LeadApiStatusCode; body: Record<string, unknown> }> {
  const { tid, status: requestedStatus, payout, currency, reason, request } = params

  // ── API Key verification ──────────────────────────────────────────────
  let apiKeyHash = "unknown"
  if (env.LEAD_API_KEY) {
    const apiKey =
      request.headers.get("x-api-key") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
    if (apiKey !== env.LEAD_API_KEY) {
      return {
        status: 401,
        body: { success: false, error: "UNAUTHORIZED", message: "Invalid or missing API key" },
      }
    }
    // Hash the API key for audit trail (don't store raw key)
    apiKeyHash = createHash("sha256").update(apiKey).digest("hex").slice(0, 16)
  }

  const db = getDatabase()

  try {
    // ── Find the lead by tid ────────────────────────────────────────────
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.tid, tid))
      .limit(1)

    if (!lead) {
      return {
        status: 404,
        body: { success: false, error: "LEAD_NOT_FOUND", message: "No lead found for the provided tid" },
      }
    }

    // ── Run all validations via shared service ──────────────────────────
    const validation = validateAll({
      currentStatus: lead.status,
      requestedStatus,
      createdAt: lead.createdAt,
    })

    if (!validation.valid) {
      const { code, message } = validation.error!

      // Already-in-status is a soft error (return 200 with info)
      if (code === "ALREADY_IN_STATUS") {
        log.info("Status update skipped: already in requested status", {
          leadId: lead.id,
          status: requestedStatus,
          tid,
        })
        return {
          status: 200,
          body: {
            success: true,
            leadId: lead.id,
            status: lead.status,
            message,
          },
        }
      }

      // Hard errors
      log.warn("Status update rejected", {
        leadId: lead.id,
        currentStatus: lead.status,
        requestedStatus,
        tid,
        reason: code,
      })
      return {
        status: 400,
        body: { success: false, error: code, message },
      }
    }

    // ── Check for duplicate status update (no-op) ────────────────────────
    if (isAlreadyInStatus(lead.status, requestedStatus)) {
      log.info("Status update skipped: already in requested status", {
        leadId: lead.id,
        status: requestedStatus,
        tid,
      })
      return {
        status: 200,
        body: {
          success: true,
          leadId: lead.id,
          status: lead.status,
          message: "Lead is already in the requested status",
        },
      }
    }

    // ── Build update payload via shared service ─────────────────────────
    const updatePayload = buildStatusUpdatePayload(
      {
        currentStatus: lead.status,
        requestedStatus,
        createdAt: lead.createdAt,
        payout,
        currency,
        rejectionReason: reason,
      },
      apiKeyHash,
    )

    // ── Update lead status ──────────────────────────────────────────────
    const [updated] = await db
      .update(leads)
      .set(updatePayload)
      .where(eq(leads.id, lead.id))
      .returning({ id: leads.id, status: leads.status })

    log.info("Lead status updated", {
      leadId: lead.id,
      previousStatus: lead.status,
      newStatus: requestedStatus,
      updatedBy: apiKeyHash,
      tid,
    })

    return {
      status: 200,
      body: {
        success: true,
        leadId: updated?.id ?? lead.id,
        status: updated?.status ?? requestedStatus,
      },
    }
  } catch (error) {
    log.error("Lead status update failed", {
      tid,
      message: error instanceof Error ? error.message : String(error),
    })
    return {
      status: 500,
      body: { success: false, error: "TRACKING_ERROR", message: "Failed to update lead status" },
    }
  }
}

// ─── Route Definition ────────────────────────────────────────────────────────

export const leadStatusRoute = new Elysia()

  // POST /lead/status — JSON body
  .post(
    "/lead/status",
    async ({ body, request, set }) => {
      const result = await handleLeadStatusUpdate({
        tid: body.tid,
        status: body.status,
        payout: body.payout,
        currency: body.currency,
        reason: body.reason,
        request,
      })
      set.status = result.status
      return result.body
    },
    { body: LeadStatusBodySchema }
  )

  // GET /lead/status?tid=xxx&status=yyy — query string (no payout override)
  .get(
    "/lead/status",
    async ({ query, request, set }) => {
      if (!query.tid || !query.status) {
        set.status = 400
        return { success: false, error: "INVALID_PARAMETERS", message: "tid and status are required" }
      }
      const result = await handleLeadStatusUpdate({
        tid: query.tid,
        status: query.status,
        request,
      })
      set.status = result.status
      return result.body
    },
    {
      query: t.Object({
        tid: t.String(),
        status: t.String(),
      }),
    }
  )