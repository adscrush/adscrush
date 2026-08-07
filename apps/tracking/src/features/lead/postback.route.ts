import { Elysia, t } from "elysia"
import { handleLeadSubmission } from "./lead.service.js"
import { logger } from "../../lib/logger.js"
import env from "../../config/env.js"

const log = logger({ module: "lead-postback" })

if (!env.LEAD_API_KEY) {
  log.warn("LEAD_API_KEY not configured — lead postback is open to unauthenticated requests")
}

// ─── Input validation schemas ────────────────────────────────────────────────

// POST-only PII schema (name/phone/email only accepted via POST)
const LeadPostbackBodySchema = t.Object({
  tid: t.Optional(t.String()),
  click_id: t.Optional(t.String()),
  name: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  email: t.Optional(t.String()),
  address: t.Optional(t.String()),
  pincode: t.Optional(t.String()),
  city: t.Optional(t.String()),
  state: t.Optional(t.String()),
  sub1: t.Optional(t.String()),
  sub2: t.Optional(t.String()),
  sub3: t.Optional(t.String()),
  sub4: t.Optional(t.String()),
  sub5: t.Optional(t.String()),
  payout: t.Optional(t.String()),
  currency: t.Optional(t.String()),
})

// GET schema — tid + sub fields only, no PII (phone/email/name/address)
const LeadPostbackQuerySchema = t.Object({
  tid: t.Optional(t.String()),
  click_id: t.Optional(t.String()),
  sub1: t.Optional(t.String()),
  sub2: t.Optional(t.String()),
  sub3: t.Optional(t.String()),
  sub4: t.Optional(t.String()),
  sub5: t.Optional(t.String()),
  payout: t.Optional(t.String()),
  currency: t.Optional(t.String()),
})

// ─── Route definitions ───────────────────────────────────────────────────────

export const leadPostbackRoute = new Elysia()

  // GET /lead/postback — query string based (no PII, tid + subs only)
  .get(
    "/lead/postback",
    async ({ query, request, set }) => {
      const result = await handleLeadSubmission({
        tid: query.tid ?? query.click_id ?? "",
        sub1: query.sub1,
        sub2: query.sub2,
        sub3: query.sub3,
        sub4: query.sub4,
        sub5: query.sub5,
        payout: query.payout,
        currency: query.currency,
        method: "postback",
        request,
      })
      set.status = result.status
      return {
        success: result.success,
        isDuplicate: result.isDuplicate,
        ...(result.leadId && { leadId: result.leadId }),
        ...(result.error && { error: result.error }),
      }
    },
    { query: LeadPostbackQuerySchema }
  )

  // POST /lead/postback — JSON body (full lead data including PII)
  .post(
    "/lead/postback",
    async ({ body, request, set }) => {
      const result = await handleLeadSubmission({
        tid: body.tid ?? body.click_id ?? "",
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        pincode: body.pincode,
        city: body.city,
        state: body.state,
        sub1: body.sub1,
        sub2: body.sub2,
        sub3: body.sub3,
        sub4: body.sub4,
        sub5: body.sub5,
        payout: body.payout,
        currency: body.currency,
        method: "postback",
        request,
      })
      set.status = result.status
      return {
        success: result.success,
        isDuplicate: result.isDuplicate,
        ...(result.leadId && { leadId: result.leadId }),
        ...(result.error && { error: result.error }),
      }
    },
    { body: LeadPostbackBodySchema }
  )
