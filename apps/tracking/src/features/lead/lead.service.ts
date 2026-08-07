import { eq } from "@adscrush/db/drizzle"
import { getDatabase } from "../../config/database.js"
import { clicks, leads, products } from "@adscrush/db/schema"
import { LEAD_STATUS } from "@adscrush/shared/constants/status"
import { generateId } from "@adscrush/shared/lib/id"
import { encryptPII } from "@adscrush/db/encrypt"
import { createHash } from "node:crypto"
import { logger } from "../../lib/logger.js"
import { isUuid } from "../../lib/uuid.js"
import env from "../../config/env.js"

const log = logger({ module: "lead" })

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_NAME_LENGTH = 200
const MAX_EMAIL_LENGTH = 254
const MAX_PHONE_LENGTH = 20
const MAX_ADDRESS_LENGTH = 500
const MAX_PINCODE_LENGTH = 32
const MAX_CITY_STATE_LENGTH = 100
const MAX_SUB_LENGTH = 500

// ─── Sanitization Helpers ────────────────────────────────────────────────────

/** Trim and enforce max length; return null for empty strings */
export function sanitize(value: string | undefined, maxLen: number): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.slice(0, maxLen)
}

/** Extract digits only from phone string */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

/** Lowercase and trim email */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// ─── API Key Verification ────────────────────────────────────────────────────

export function verifyApiKey(request: Request): boolean {
  if (!env.LEAD_API_KEY) {
    // Fail closed in production: if no key is configured, refuse unauthenticated
    // requests. In development/test, allow open access for convenience.
    if (env.NODE_ENV === "production") return false
    return true
  }
  const apiKey =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return apiKey === env.LEAD_API_KEY
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LeadSubmissionParams {
  tid: string
  name?: string
  phone?: string
  email?: string
  address?: string
  pincode?: string
  city?: string
  state?: string
  sub1?: string
  sub2?: string
  sub3?: string
  sub4?: string
  sub5?: string
  payout?: string
  currency?: string
  method: "pixel" | "postback"
  request: Request
}

/** HTTP status codes used by the lead submission API responses. */
export type LeadApiStatusCode = 200 | 400 | 401 | 404 | 500

export interface LeadSubmissionResult {
  success: boolean
  leadId?: string
  isDuplicate: boolean
  error?: string
  status: LeadApiStatusCode
}

// ─── Core Handler ────────────────────────────────────────────────────────────

/**
 * Shared lead submission logic used by both pixel and postback routes.
 * Handles click lookup, product lookup, sanitization, normalization,
 * PII encryption, and dedup-aware insert.
 */
export async function handleLeadSubmission(
  params: LeadSubmissionParams
): Promise<LeadSubmissionResult> {
  const {
    tid,
    name,
    phone,
    email,
    address,
    pincode,
    city,
    state,
    sub1,
    sub2,
    sub3,
    sub4,
    sub5,
    payout,
    currency,
    method,
    request,
  } = params

  if (!tid) {
    return { success: false, isDuplicate: false, error: "tid is required", status: 400 }
  }

  // ── API Key verification ──────────────────────────────────────────────
  if (!verifyApiKey(request)) {
    return { success: false, isDuplicate: false, error: "Invalid or missing API key", status: 401 }
  }

  // ── tid format guard ──────────────────────────────────────────────────
  // clicks.tid is a uuid column; a malformed tid would throw a SQL error
  // (500) instead of a clean "not found" (404).
  if (!isUuid(tid)) {
    return { success: false, isDuplicate: false, error: "No click found for the provided tid", status: 404 }
  }

  const db = getDatabase()

  try {
    // ── Click lookup ────────────────────────────────────────────────────
    const [click] = await db
      .select()
      .from(clicks)
      .where(eq(clicks.tid, tid))
      .limit(1)

    if (!click) {
      return { success: false, isDuplicate: false, error: "No click found for the provided tid", status: 404 }
    }

    // ── Product lookup ──────────────────────────────────────────────────
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, click.productId))
      .limit(1)

    if (!product || product.status !== "active") {
      return { success: false, isDuplicate: false, error: "Product not found or inactive", status: 400 }
    }

    // ── Sanitize inputs ─────────────────────────────────────────────────
    const sanitizedName = sanitize(name, MAX_NAME_LENGTH)
    const sanitizedPhone = sanitize(phone, MAX_PHONE_LENGTH)
    const sanitizedEmail = sanitize(email, MAX_EMAIL_LENGTH)
    const sanitizedAddress = sanitize(address, MAX_ADDRESS_LENGTH)
    const sanitizedPincode = sanitize(pincode, MAX_PINCODE_LENGTH)
    const sanitizedCity = sanitize(city, MAX_CITY_STATE_LENGTH)
    const sanitizedState = sanitize(state, MAX_CITY_STATE_LENGTH)

    if (!sanitizedName && !sanitizedPhone && !sanitizedEmail) {
      return { success: false, isDuplicate: false, error: "At least one of name, phone, or email is required", status: 400 }
    }

    // ── Normalize phone and email for search/dedup ──────────────────────
    const phoneNormalized = sanitizedPhone ? normalizePhone(sanitizedPhone) : null
    const emailNormalized = sanitizedEmail ? normalizeEmail(sanitizedEmail) : null

    // ── Extract client IP ───────────────────────────────────────────────
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined

    // ── Encrypt IP and user-agent for privacy ───────────────────────────
    let ipEncrypted: string | undefined
    let userAgentEncrypted: string | undefined

    try {
      if (clientIp) ipEncrypted = await encryptPII(clientIp)
      const ua = request.headers.get("user-agent") ?? undefined
      if (ua) userAgentEncrypted = await encryptPII(ua)
    } catch (err) {
      log.warn("PII encryption failed for lead, continuing without encryption", {
        message: err instanceof Error ? err.message : String(err),
      })
    }

    // ── Hash IP for dedup lookups ───────────────────────────────────────
    const ipHash = clientIp
      ? createHash("sha256").update(clientIp).digest("hex").slice(0, 16)
      : null

    const resolvedPayout = payout ?? product.defaultPayout ?? "0"
    const leadId = generateId("lead")

    // ── Insert with ON CONFLICT for dedup ───────────────────────────────
    const [lead] = await db
      .insert(leads)
      .values({
        id: leadId,
        clickId: click.id,
        tid: click.tid,
        productId: click.productId,
        mediaBuyerId: click.mediaBuyerId,
        advertiserId: click.advertiserId,
        campaignId: click.campaignId,
        name: sanitizedName,
        phone: sanitizedPhone,
        phoneNormalized,
        email: sanitizedEmail,
        emailNormalized,
        address: sanitizedAddress,
        pincode: sanitizedPincode,
        city: sanitizedCity,
        state: sanitizedState,
        sub1: sanitize(sub1, MAX_SUB_LENGTH),
        sub2: sanitize(sub2, MAX_SUB_LENGTH),
        sub3: sanitize(sub3, MAX_SUB_LENGTH),
        sub4: sanitize(sub4, MAX_SUB_LENGTH),
        sub5: sanitize(sub5, MAX_SUB_LENGTH),
        payout: resolvedPayout,
        currency: currency ?? product.currency ?? "USD",
        status: LEAD_STATUS.PENDING,
        method,
        referrerUrl: request.headers.get("referer") ?? undefined,
        ipHash,
        ipEncrypted,
        geoCountry: click.geoCountry,
        userAgentEncrypted,
      })
      .onConflictDoNothing({ target: leads.clickId })
      .returning({ id: leads.id })

    const isDuplicate = !lead

    if (isDuplicate) {
      log.info("Duplicate lead rejected", { clickId: click.id, tid })
      const [existing] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.clickId, click.id))
        .limit(1)
      return { success: true, leadId: existing?.id, isDuplicate: true, status: 200 }
    }

    log.info("Lead tracked", { leadId: lead.id, clickId: click.id })
    return { success: true, leadId: lead.id, isDuplicate: false, status: 200 }
  } catch (error) {
    log.error("Lead submission failed", {
      tid,
      message: error instanceof Error ? error.message : String(error),
    })
    return { success: false, isDuplicate: false, error: "Failed to track lead", status: 500 }
  }
}
