import { eq, and, sql } from "@adscrush/db/drizzle"
import type { Database } from "@adscrush/db"
import { clicks, conversions, products } from "@adscrush/db/schema"
import { CONVERSION_STATUS } from "@adscrush/shared/constants/status"
import { generateId } from "@adscrush/shared/lib/id"
import { encryptPII } from "@adscrush/db/encrypt"
import { logger } from "../../lib/logger.js"
import { isUuid } from "../../lib/uuid.js"
import { createHash } from "node:crypto"

/**
 * Deterministic lock key from (clickId, event) for pg_advisory_xact_lock.
 * Uses a 64-bit hash that fits PostgreSQL's bigint lock key.
 * Lower 32 bits = clickId hash, upper 32 bits = event hash.
 */
function lockKey(clickId: string, event: string): number {
  const cHash = createHash("md5").update(clickId).digest().readUInt32LE(0)
  const eHash = createHash("md5").update(event).digest().readUInt32LE(0)
  return ((cHash & 0xffff) << 16) | (eHash & 0xffff)
}

export interface TrackConversionInput {
  tid: string
  event?: string
  payout?: string
  saleAmount?: string
  currency?: string
  coupon?: string
  advSub1?: string
  advSub2?: string
  advSub3?: string
  advSub4?: string
  advSub5?: string
  ipAddress?: string
  userAgent?: string
  method?: "pixel" | "iframe" | "s2s" | "postback"
  postbackUrl?: string
  referrerUrl?: string
}

export async function trackConversion(
  db: Database,
  input: TrackConversionInput
) {
  // clicks.tid is a uuid column; a malformed tid would throw a SQL error
  // (500) instead of a clean "not found" (404).
  if (!isUuid(input.tid)) {
    return { success: false, error: "Click not found" }
  }

  const [click] = await db
    .select()
    .from(clicks)
    .where(eq(clicks.tid, input.tid))
    .limit(1)

  if (!click) {
    return { success: false, error: "Click not found" }
  }

  // Look up the product for default payout/revenue/currency
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, click.productId))
    .limit(1)

  if (!product || product.status !== "active") {
    return { success: false, error: "Product not found or inactive" }
  }

  const event = input.event ?? "conversion"

  // ── PII Encryption ─────────────────────────────────────────────────────────
  // Fail-open: if encryption fails, log a warning and continue without it.
  // This prevents a misconfigured PII key from bricking all conversion tracking.
  let ipEncrypted: string | undefined
  let userAgentEncrypted: string | undefined
  try {
    ipEncrypted = input.ipAddress ? await encryptPII(input.ipAddress) : undefined
    userAgentEncrypted = input.userAgent ? await encryptPII(input.userAgent) : undefined
  } catch (err) {
    const log2 = logger({ module: "conversion" })
    log2.warn("PII encryption failed, continuing without encryption", {
      message: err instanceof Error ? err.message : String(err),
    })
  }

  // ── Payout / Revenue Resolution ────────────────────────────────────────────
  const payout =
    input.payout ??
    product.defaultPayout ??
    "0"

  const conversionId = generateId("conversion")

  // ── Atomic Deduplication with Advisory Lock ──────────────────────────────
  // PostgreSQL's partitioned tables can't have unique constraints on
  // non-partition-key columns. We use pg_advisory_xact_lock to serialize
  // requests for the same (clickId, event), preventing concurrent duplicate
  // inserts. The lock auto-releases at transaction commit/rollback.

  const key = lockKey(click.id, event)

  const result = await db.transaction(async (tx) => {
    // Acquire session-level advisory lock (auto-released on tx end)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${key})`)

    // Now we're serialized — check for existing
    const [existing] = await tx
      .select({ id: conversions.id })
      .from(conversions)
      .where(
        and(
          eq(conversions.clickId, click.id),
          eq(conversions.event, event)
        )
      )
      .limit(1)

    if (existing) {
      return { id: existing.id, isDuplicate: true, inserted: false }
    }

    const [conversion] = await tx
      .insert(conversions)
      .values({
        id: conversionId,
        clickId: click.id,
        mediaBuyerId: click.mediaBuyerId,
        advertiserId: click.advertiserId,
        productId: click.productId,
        campaignId: click.campaignId,
        adAccountId: click.adAccountId,
        creativeId: click.creativeId,
        creativeName: click.creativeName,
        creativeThumbnailUrl: click.creativeThumbnailUrl,
        event,
        payout,
        revenue: product.defaultRevenue ?? "0",
        saleAmount: input.saleAmount,
        currency: input.currency ?? product.currency,
        status: CONVERSION_STATUS.PENDING,
        isDuplicate: false,
        coupon: input.coupon,
        advSub1: input.advSub1,
        advSub2: input.advSub2,
        advSub3: input.advSub3,
        advSub4: input.advSub4,
        advSub5: input.advSub5,
        method: input.method ?? "pixel",
        postbackUrl: input.postbackUrl,
        referrerUrl: input.referrerUrl,
        ipEncrypted,
        userAgentEncrypted,
      })
      .returning({ id: conversions.id })

    return { id: conversion?.id, isDuplicate: false, inserted: true }
  })

  return {
    success: true,
    isDuplicate: result.isDuplicate,
    conversionId: result.id,
  }
}
