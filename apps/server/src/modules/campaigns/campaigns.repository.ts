import { and, asc, desc, eq, ilike, inArray, isNotNull, or, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import {
  adAccounts,
  campaignAdAccounts,
  campaignCreatives,
  campaigns,
  clicks,
  conversions,
  creativeFiles,
  creatives,
  products,
  funnels,
  landingPages,
  mediaBuyers,
  users,
} from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { CreateCampaignInput } from "@adscrush/shared/validators/campaign.schema"
import type { ListCampaignsInput } from "./campaigns.types"

// ─── Campaign Queries ────────────────────────────────────────────────────────

export async function findCampaigns(
  db: Database,
  input: ListCampaignsInput,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  const { page, perPage, sort, filters, joinOperator, search, status, productId } = input
  const offset = (page - 1) * perPage

  const tableWithJoinedColumns = {
    ...campaigns,
    productName: products.name,
    product: products.id,
    funnelName: funnels.name,
  }

  const advancedWhere = filterColumns({
    table: tableWithJoinedColumns,
    filters,
    joinOperator,
    database: "postgres",
  })

  const simpleWhere =
    search || (status && status.length > 0) || productId
      ? and(
          search ? ilike(campaigns.name, `%${search}%`) : undefined,
          status && status.length > 0 ? inArray(campaigns.status, status) : undefined,
          productId ? eq(campaigns.productId, productId) : undefined
        )
      : undefined

  const where = and(
    filters.length > 0 ? advancedWhere : simpleWhere,
    !scope.isAllAdvertisers
      ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
      : undefined
  )

  const orderBy =
    sort.length > 0
      ? sort.map((item) =>
          item.desc
            ? desc(getColumn(tableWithJoinedColumns, item.id))
            : asc(getColumn(tableWithJoinedColumns, item.id))
        )
      : [desc(campaigns.createdAt)]

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        productId: campaigns.productId,
        funnelId: campaigns.funnelId,
        status: campaigns.status,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        internalNotes: campaigns.internalNotes,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          image: products.image,
        },
        funnel: {
          id: funnels.id,
          name: funnels.name,
        },
      })
      .from(campaigns)
      .innerJoin(products, eq(campaigns.productId, products.id))
      .leftJoin(funnels, eq(campaigns.funnelId, funnels.id))
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(...orderBy),
    db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns)
      .innerJoin(products, eq(campaigns.productId, products.id))
      .leftJoin(funnels, eq(campaigns.funnelId, funnels.id))
      .where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  // Batch fetch creative & ad account data
  if (items.length > 0) {
    const campaignIds = items.map((i) => i.id)

    const [creativeCountRows, adAccountCountRows, allCampaignCreatives, landingPageCountRows] =
      await Promise.all([
        db
          .select({
            campaignId: campaignCreatives.campaignId,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(campaignCreatives)
          .where(inArray(campaignCreatives.campaignId, campaignIds))
          .groupBy(campaignCreatives.campaignId),
        db
          .select({
            campaignId: campaignAdAccounts.campaignId,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(campaignAdAccounts)
          .where(inArray(campaignAdAccounts.campaignId, campaignIds))
          .groupBy(campaignAdAccounts.campaignId),
        db
          .select({
            campaignId: campaignCreatives.campaignId,
            creativeId: campaignCreatives.creativeId,
            creativeName: creatives.name,
            thumbnailUrl: creativeFiles.thumbnailUrl,
            cdnUrl: creativeFiles.cdnUrl,
          })
          .from(campaignCreatives)
          .innerJoin(creatives, eq(campaignCreatives.creativeId, creatives.id))
          .leftJoin(creativeFiles, eq(creativeFiles.creativeId, creatives.id))
          .where(inArray(campaignCreatives.campaignId, campaignIds))
          .orderBy(asc(campaignCreatives.sortOrder), asc(creativeFiles.sortOrder)),
        db
          .select({
            funnelId: landingPages.funnelId,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(landingPages)
          .where(
            inArray(
              landingPages.funnelId,
              [...new Set(items.map((i) => i.funnelId).filter((id): id is string => id !== null))]
            )
          )
          .groupBy(landingPages.funnelId),
      ])

    const creativeCountMap = new Map(creativeCountRows.map((r) => [r.campaignId, r.count]))
    const adAccountCountMap = new Map(adAccountCountRows.map((r) => [r.campaignId, r.count]))
    const landingPageCountMap = new Map(landingPageCountRows.map((r) => [r.funnelId, r.count]))

    const campaignCreativeMap = new Map<
      string,
      Array<{ id: string; name: string; thumbnailUrl: string | null }>
    >()
    for (const row of allCampaignCreatives) {
      const existing = campaignCreativeMap.get(row.campaignId) ?? []
      if (existing.some((c) => c.id === row.creativeId)) continue
      if (existing.length >= 2) continue
      existing.push({
        id: row.creativeId,
        name: row.creativeName ?? "Unknown",
        thumbnailUrl: row.thumbnailUrl ?? row.cdnUrl ?? null,
      })
      campaignCreativeMap.set(row.campaignId, existing)
    }

    for (const item of items) {
      ;(item as Record<string, unknown>).creativeCount = creativeCountMap.get(item.id) ?? 0
      ;(item as Record<string, unknown>).adAccountCount = adAccountCountMap.get(item.id) ?? 0
      ;(item as Record<string, unknown>).creatives = campaignCreativeMap.get(item.id) ?? []
      ;(item as Record<string, unknown>).landingPageCount = item.funnelId
        ? landingPageCountMap.get(item.funnelId) ?? 0
        : 0
    }
  }

  return { items, pageCount: Math.ceil(total / perPage), total }
}

export async function findCampaignById(db: Database, id: string) {
  const [result] = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      productId: campaigns.productId,
      funnelId: campaigns.funnelId,
      status: campaigns.status,
      startDate: campaigns.startDate,
      endDate: campaigns.endDate,
      internalNotes: campaigns.internalNotes,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,
      advertiserId: products.advertiserId,
      product: {
        id: products.id,
        name: products.name,
        image: products.image,
      },
      funnel: {
        id: funnels.id,
        name: funnels.name,
      },
    })
    .from(campaigns)
    .innerJoin(products, eq(campaigns.productId, products.id))
    .leftJoin(funnels, eq(campaigns.funnelId, funnels.id))
    .where(eq(campaigns.id, id))
    .limit(1)

  return result ?? null
}

export async function createCampaign(db: Database, data: CreateCampaignInput) {
  const [funnel] = await db
    .select({ productId: funnels.productId })
    .from(funnels)
    .where(eq(funnels.id, data.funnelId))
    .limit(1)

  if (!funnel) return null

  const [campaign] = await db
    .insert(campaigns)
    .values({ ...data, funnelId: data.funnelId, productId: funnel.productId })
    .returning()

  return campaign ?? null
}

export async function updateCampaign(
  db: Database,
  id: string,
  data: Partial<Pick<typeof campaigns.$inferInsert, "name" | "funnelId" | "status" | "startDate" | "endDate" | "internalNotes">>
) {
  const [updated] = await db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning()
  return updated ?? null
}

export async function deleteCampaign(db: Database, id: string) {
  const [deleted] = await db.delete(campaigns).where(eq(campaigns.id, id)).returning()
  return deleted ?? null
}

// ─── Ad Account Queries ──────────────────────────────────────────────────────

export async function findCampaignAdAccounts(db: Database, campaignId: string) {
  return db
    .select({
      id: campaignAdAccounts.id,
      adAccountId: campaignAdAccounts.adAccountId,
      adAccount: {
        name: adAccounts.name,
        platform: adAccounts.sourcePlatform,
      },
    })
    .from(campaignAdAccounts)
    .innerJoin(adAccounts, eq(campaignAdAccounts.adAccountId, adAccounts.id))
    .where(eq(campaignAdAccounts.campaignId, campaignId))
}

export async function assignAdAccount(
  db: Database,
  campaignId: string,
  adAccountId: string,
  trackingLink: string
) {
  const [assignment] = await db
    .insert(campaignAdAccounts)
    .values({ campaignId, adAccountId, trackingLink })
    .onConflictDoUpdate({
      target: [campaignAdAccounts.campaignId, campaignAdAccounts.adAccountId],
      set: { trackingLink },
    })
    .returning()

  return assignment
}

export async function removeAdAccount(db: Database, campaignId: string, adAccountId: string) {
  await db
    .delete(campaignAdAccounts)
    .where(and(eq(campaignAdAccounts.campaignId, campaignId), eq(campaignAdAccounts.adAccountId, adAccountId)))

  return { success: true }
}

export async function findCampaignAdAccountWithAssignment(
  db: Database,
  campaignId: string,
  adAccountId: string
) {
  const [link] = await db
    .select({ trackingLink: campaignAdAccounts.trackingLink })
    .from(campaignAdAccounts)
    .where(and(eq(campaignAdAccounts.campaignId, campaignId), eq(campaignAdAccounts.adAccountId, adAccountId)))
    .limit(1)

  return link ?? null
}

export async function findAllAdAccountsWithAssignment(
  db: Database,
  campaignId: string,
  options: {
    search?: string
    filter: "all" | "assigned"
    mediaBuyerIds?: string[]
    page: number
    perPage: number
  }
) {
  const { search, filter, mediaBuyerIds, page, perPage } = options
  const offset = (page - 1) * perPage

  const campaignWhere = eq(campaignAdAccounts.campaignId, campaignId)

  const searchWhere = search
    ? or(ilike(adAccounts.name, `%${search}%`), ilike(adAccounts.accountId, `%${search}%`))
    : undefined

  const mediaBuyerWhere =
    mediaBuyerIds && mediaBuyerIds.length > 0
      ? inArray(adAccounts.mediaBuyerId, mediaBuyerIds)
      : undefined

  const hasMediaBuyerWhere = isNotNull(adAccounts.mediaBuyerId)

  const baseWhere = and(
    searchWhere,
    mediaBuyerWhere,
    hasMediaBuyerWhere,
    filter === "assigned"
      ? sql` EXISTS (SELECT 1 FROM ${campaignAdAccounts} WHERE ${campaignAdAccounts.adAccountId} = ${adAccounts.id} AND ${campaignAdAccounts.campaignId} = ${campaignId}) `
      : undefined
  )

  const [items, allTotalResult, filteredTotalResult, assignedResult] = await Promise.all([
    db
      .select({
        id: adAccounts.id,
        name: adAccounts.name,
        platform: adAccounts.sourcePlatform,
        accountId: adAccounts.accountId,
        assignedId: campaignAdAccounts.id,
        mediaBuyerName: mediaBuyers.name,
        mediaBuyerImage: users.image,
      })
      .from(adAccounts)
      .leftJoin(
        campaignAdAccounts,
        and(eq(campaignAdAccounts.adAccountId, adAccounts.id), campaignWhere)
      )
      .leftJoin(mediaBuyers, eq(adAccounts.mediaBuyerId, mediaBuyers.id))
      .leftJoin(users, eq(mediaBuyers.userId, users.id))
      .where(baseWhere)
      .orderBy(asc(adAccounts.name))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(adAccounts)
      .where(hasMediaBuyerWhere),
    filter === "assigned"
      ? db
          .select({ count: sql<number>`count(*)::int` })
          .from(adAccounts)
          .where(baseWhere)
      : Promise.resolve([{ count: 0 }]),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(campaignAdAccounts)
      .innerJoin(adAccounts, eq(campaignAdAccounts.adAccountId, adAccounts.id))
      .where(and(eq(campaignAdAccounts.campaignId, campaignId), mediaBuyerWhere, hasMediaBuyerWhere)),
  ])

  return { items, allTotalResult, filteredTotalResult, assignedResult }
}

// ─── Creative Queries ────────────────────────────────────────────────────────

export async function findCampaignCreatives(db: Database, campaignId: string) {
  return db
    .select({
      id: campaignCreatives.id,
      creativeId: campaignCreatives.creativeId,
      creative: {
        id: creatives.id,
        name: creatives.name,
        thumbnailUrl: creativeFiles.thumbnailUrl,
        cdnUrl: creativeFiles.cdnUrl,
      },
    })
    .from(campaignCreatives)
    .innerJoin(creatives, eq(campaignCreatives.creativeId, creatives.id))
    .leftJoin(creativeFiles, eq(creativeFiles.creativeId, creatives.id))
    .where(eq(campaignCreatives.campaignId, campaignId))
    .orderBy(asc(campaignCreatives.sortOrder), asc(creativeFiles.sortOrder))
}

export async function syncCampaignCreatives(
  db: Database,
  campaignId: string,
  creativeIds: string[]
) {
  const currentLinks = await db
    .select({ creativeId: campaignCreatives.creativeId })
    .from(campaignCreatives)
    .where(eq(campaignCreatives.campaignId, campaignId))

  const currentIds = new Set(currentLinks.map((l) => l.creativeId))
  const desiredIds = new Set(creativeIds)

  const toAdd = creativeIds.filter((id) => !currentIds.has(id))
  const toRemove = [...currentIds].filter((id) => !desiredIds.has(id))

  await db.transaction(async (tx) => {
    if (toRemove.length > 0) {
      await tx
        .delete(campaignCreatives)
        .where(
          and(
            eq(campaignCreatives.campaignId, campaignId),
            inArray(campaignCreatives.creativeId, toRemove)
          )
        )
    }
    if (toAdd.length > 0) {
      await tx.insert(campaignCreatives).values(
        toAdd.map((creativeId, index) => ({
          campaignId,
          creativeId,
          sortOrder: index,
        }))
      )
    }
  })

  return { added: toAdd.length, removed: toRemove.length }
}

export async function findCampaignForCreativeTracking(db: Database, campaignId: string) {
  const [campaign] = await db
    .select({ funnelId: campaigns.funnelId })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1)

  return campaign ?? null
}

export async function findLandingPagesByFunnelId(db: Database, funnelId: string) {
  return db
    .select({ id: landingPages.id, name: landingPages.name })
    .from(landingPages)
    .where(eq(landingPages.funnelId, funnelId))
}

export async function findCampaignAdAccountsForTracking(db: Database, campaignId: string) {
  return db
    .select({
      adAccountId: campaignAdAccounts.adAccountId,
      adAccountName: adAccounts.name,
      adAccountPlatform: adAccounts.sourcePlatform,
    })
    .from(campaignAdAccounts)
    .innerJoin(adAccounts, eq(campaignAdAccounts.adAccountId, adAccounts.id))
    .where(eq(campaignAdAccounts.campaignId, campaignId))
}

export async function findCampaignCreativesForTracking(db: Database, campaignId: string) {
  return db
    .select({
      creativeId: campaignCreatives.creativeId,
      creativeName: creatives.name,
      creativeThumbnailUrl: creativeFiles.thumbnailUrl,
      creativeCdnUrl: creativeFiles.cdnUrl,
    })
    .from(campaignCreatives)
    .innerJoin(creatives, eq(campaignCreatives.creativeId, creatives.id))
    .leftJoin(creativeFiles, eq(creativeFiles.creativeId, creatives.id))
    .where(eq(campaignCreatives.campaignId, campaignId))
    .orderBy(asc(campaignCreatives.sortOrder), asc(creativeFiles.sortOrder))
}

// ─── Stats Queries ───────────────────────────────────────────────────────────

export async function getCampaignStats(db: Database, campaignId: string) {
  const clickStats = await db
    .select({
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
      revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
      payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
    })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .where(eq(clicks.campaignId, campaignId))

  return clickStats[0]
}

export async function getCampaignCreativePerformance(
  db: Database,
  campaignId: string,
  startDate: Date,
  endDate: Date
) {
  const conditions = and(
    eq(clicks.campaignId, campaignId),
    sql`${clicks.createdAt} >= ${startDate.toISOString()}`,
    sql`${clicks.createdAt} <= ${endDate.toISOString()}`
  )

  return db
    .select({
      creativeId: clicks.creativeId,
      creativeName: clicks.creativeName,
      creativeThumbnailUrl: clicks.creativeThumbnailUrl,
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      uniqueClicks: sql<number>`count(DISTINCT case when ${clicks.isUnique} then ${clicks.id} end)`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
      approvedConversions: sql<number>`count(DISTINCT case when ${conversions.status} = 'approved' then ${conversions.id} end)`,
      revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
      payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
    })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .where(conditions)
    .groupBy(clicks.creativeId, clicks.creativeName, clicks.creativeThumbnailUrl)
    .orderBy(desc(sql<number>`count(DISTINCT ${clicks.id})`))
}

// ─── Tracking Link Queries ───────────────────────────────────────────────────

export async function regenerateAllTrackingLinks(db: Database) {
  const assignments = await db
    .select({
      id: campaignAdAccounts.id,
      campaignId: campaignAdAccounts.campaignId,
      adAccountId: campaignAdAccounts.adAccountId,
    })
    .from(campaignAdAccounts)

  return assignments
}

export async function updateTrackingLink(db: Database, id: string, trackingLink: string) {
  await db
    .update(campaignAdAccounts)
    .set({ trackingLink })
    .where(eq(campaignAdAccounts.id, id))
}
