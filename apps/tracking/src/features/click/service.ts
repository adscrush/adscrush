import { eq, and, gte, sql } from "@adscrush/db/drizzle"
import type { Database } from "@adscrush/db"
import { campaigns, products, adAccounts, campaignAdAccounts, funnels, landingPages, clicks, creatives, campaignCreatives, creativeFiles } from "@adscrush/db/schema"
import type { NewClick } from "@adscrush/db/schema"
import { hashIP } from "@adscrush/db/encrypt"
import { selectByWeight } from "../../lib/weighted-selection.js"

export interface ValidationResult {
  valid: boolean
  error?: string
  product?: typeof products.$inferSelect
  advertiserId?: string
  mediaBuyerId?: string
  sourcePlatform?: string
  funnelId?: string | null
}

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000

export async function validateCampaignAndProduct(
  db: Database,
  campaignId: string,
  adAccountId: string
): Promise<ValidationResult> {
  const [campaign] = await db
    .select({
      id: campaigns.id,
      productId: campaigns.productId,
      funnelId: campaigns.funnelId,
      status: campaigns.status,
    })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1)

  if (!campaign) return { valid: false, error: "Campaign not found" }
  if (campaign.status !== "active") return { valid: false, error: "Campaign is inactive" }

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, campaign.productId), eq(products.status, "active")))
    .limit(1)

  if (!product) return { valid: false, error: "Product not found or inactive" }

  // Validate that the ad account is assigned to this campaign
  const [campaignAdAccount] = await db
    .select({ adAccountId: campaignAdAccounts.adAccountId })
    .from(campaignAdAccounts)
    .where(
      and(
        eq(campaignAdAccounts.campaignId, campaignId),
        eq(campaignAdAccounts.adAccountId, adAccountId)
      )
    )
    .limit(1)

  if (!campaignAdAccount) {
    return { valid: false, error: "Ad account is not assigned to this campaign" }
  }

  // Resolve media buyer and source platform from the ad account
  const [account] = await db
    .select({
      mediaBuyerId: adAccounts.mediaBuyerId,
      sourcePlatform: adAccounts.sourcePlatform,
    })
    .from(adAccounts)
    .where(eq(adAccounts.id, adAccountId))
    .limit(1)

  return {
    valid: true,
    product,
    advertiserId: product.advertiserId,
    mediaBuyerId: account?.mediaBuyerId ?? undefined,
    sourcePlatform: account?.sourcePlatform ?? undefined,
    funnelId: campaign.funnelId,
  }
}

export async function resolveFunnel(
  db: Database,
  funnelId: string | undefined,
  productId: string
) {
  if (!funnelId) return null

  const [funnel] = await db
    .select()
    .from(funnels)
    .where(
      and(
        eq(funnels.id, funnelId),
        eq(funnels.productId, productId),
        eq(funnels.status, "active")
      )
    )
    .limit(1)

  return funnel ?? null
}

export async function selectLandingPage(
  db: Database,
  funnelId?: string | null,
  lpId?: string,
  moName?: string
) {
  // ── Direct LP ID Selection ───────────────────────────────────────────────
  if (lpId) {
    const conditions: Parameters<typeof and> = [
      eq(landingPages.id, lpId),
      eq(landingPages.status, "active"),
    ]
    if (funnelId) conditions.push(eq(landingPages.funnelId, funnelId))

    const [lp] = await db
      .select()
      .from(landingPages)
      .where(and(...conditions))
      .limit(1)
    return lp ?? null
  }

  // ── Named Landing Page Selection (MO parameter) ──────────────────────────
  if (moName && moName !== "r") {
    const conditions: Parameters<typeof and> = [
      eq(landingPages.status, "active"),
      sql`LOWER(REPLACE(${landingPages.name}, ' ', '')) = ${moName.toLowerCase()}`,
    ]
    if (funnelId) conditions.push(eq(landingPages.funnelId, funnelId))

    const [lp] = await db
      .select()
      .from(landingPages)
      .where(and(...conditions))
      .limit(1)
    if (lp) return lp
  }

  // ── Weight-Based Random Selection ────────────────────────────────────────
  const conditions: Parameters<typeof and> = [eq(landingPages.status, "active")]
  if (funnelId) conditions.push(eq(landingPages.funnelId, funnelId))

  const allLandingPages = await db
    .select()
    .from(landingPages)
    .where(and(...conditions))

  if (allLandingPages.length === 0) {
    return null
  }

  // Use weighted selection algorithm instead of random()
  return selectByWeight(allLandingPages)
}

export async function isUniqueClick(
  db: Database,
  mediaBuyerId: string,
  productId: string,
  ipAddress: string
): Promise<boolean> {
  const windowStart = new Date(Date.now() - DEDUP_WINDOW_MS)
  const ipHashValue = hashIP(ipAddress)

  const [existing] = await db
    .select({ id: clicks.id })
    .from(clicks)
    .where(
      and(
        eq(clicks.mediaBuyerId, mediaBuyerId),
        eq(clicks.productId, productId),
        eq(clicks.ipHash, ipHashValue),
        gte(clicks.createdAt, windowStart)
      )
    )
    .limit(1)

  return existing === undefined
}

export async function recordClick(db: Database, click: NewClick) {
  const [inserted] = await db.insert(clicks).values(click).returning()
  return inserted
}

export interface CreativeData {
  id: string
  name: string
  thumbnailUrl: string | null
}

export async function validateAndLookupCreative(
  db: Database,
  campaignId: string,
  creativeId: string
): Promise<CreativeData | null> {
  // First check if creative is linked to this campaign
  const [campaignCreative] = await db
    .select({ creativeId: campaignCreatives.creativeId })
    .from(campaignCreatives)
    .where(
      and(
        eq(campaignCreatives.campaignId, campaignId),
        eq(campaignCreatives.creativeId, creativeId)
      )
    )
    .limit(1)

  if (!campaignCreative) return null

  // Look up creative metadata with first file for thumbnail
  const [creative] = await db
    .select({
      id: creatives.id,
      name: creatives.name,
      thumbnailUrl: creativeFiles.thumbnailUrl,
      cdnUrl: creativeFiles.cdnUrl,
    })
    .from(creatives)
    .leftJoin(creativeFiles, eq(creativeFiles.creativeId, creatives.id))
    .where(eq(creatives.id, creativeId))
    .orderBy(sql`${creativeFiles.sortOrder} ASC`)
    .limit(1)

  if (!creative) return null

  return {
    id: creative.id,
    name: creative.name,
    thumbnailUrl: creative.thumbnailUrl ?? creative.cdnUrl ?? null,
  }
}
