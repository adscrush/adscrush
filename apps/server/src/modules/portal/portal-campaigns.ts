import { and, asc, desc, eq, isNull, sql, inArray, ilike } from "@adscrush/db/drizzle"
import {
  adAccounts,
  campaigns,
  campaignAdAccounts,
  campaignCreatives,
  creatives,
  creativeFiles,
  clicks,
  conversions,
  funnels,
  landingPages,
  productMediaBuyers,
  products,
} from "@adscrush/db/schema"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createCampaignSchema } from "@adscrush/shared/validators/campaign.schema"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"
import { env } from "~/env"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { campaignOutputSchema, listCampaignsInputSchema } from "~/modules/campaigns/campaigns.types"
import {
  assertBuyerPermission,
  assertBuyerCanEditCampaign,
  getAccessibleCampaignIds,
  portalUpdateCampaignSchema,
} from "./portal-helpers"

export const portalCampaignsRouter = router({

  // ─── My Campaigns ────────────────────────────────────────────────────────

  myCampaigns: mediaBuyerProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, mediaBuyer } = ctx
      const { page, perPage } = input

      // Scope: campaigns owned by this buyer or linked to their ad accounts
      const ids = [...(await getAccessibleCampaignIds(db, mediaBuyer.id))]

      if (ids.length === 0) {
        return { items: [], total: 0, pageCount: 0 }
      }

      const [campaignRows, countRows] = await Promise.all([
        db
          .select({
            id: campaigns.id,
            name: campaigns.name,
            status: campaigns.status,
            productId: campaigns.productId,
            funnelId: campaigns.funnelId,
            startDate: campaigns.startDate,
            endDate: campaigns.endDate,
            createdAt: campaigns.createdAt,
          })
          .from(campaigns)
          .where(and(inArray(campaigns.id, ids), isNull(campaigns.deletedAt)))
          .orderBy(desc(campaigns.createdAt))
          .limit(perPage)
          .offset((page - 1) * perPage),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(campaigns)
          .where(and(inArray(campaigns.id, ids), isNull(campaigns.deletedAt))),
      ])
      const campCount = countRows[0]?.count ?? 0

      return {
        items: campaignRows,
        total: campCount,
        pageCount: Math.ceil(campCount / perPage),
      }
    }),

  // ─── My Campaigns (full data table) ────────────────────────────────────

  myCampaignsList: mediaBuyerProcedure
    .input(listCampaignsInputSchema)
    .output(
      z.object({
        items: z.array(campaignOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, sort, filters, joinOperator, search, status } = input
      const { db, mediaBuyer } = ctx
      const offset = (page - 1) * perPage

      // Scope: campaigns owned by this buyer or linked to their ad accounts
      const campaignIds = await getAccessibleCampaignIds(db, mediaBuyer.id)
      const scopeCondition =
        campaignIds.size > 0 ? inArray(campaigns.id, [...campaignIds]) : and(eq(campaigns.id, "-1")) // No accounts → no campaigns

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
        search || (status && status.length > 0)
          ? and(
              search ? ilike(campaigns.name, `%${search}%`) : undefined,
              status && status.length > 0 ? inArray(campaigns.status, status) : undefined
            )
          : undefined

      const where = and(filters.length > 0 ? advancedWhere : simpleWhere, scopeCondition)

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

        const [creativeCountRows, adAccountCountRows, allCampaignCreatives, landingPageCountRows] = await Promise.all([
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
              inArray(landingPages.funnelId, [
                ...new Set(items.map((i) => i.funnelId).filter((id): id is string => id !== null)),
              ])
            )
            .groupBy(landingPages.funnelId),
        ])

        const creativeCountMap = new Map(creativeCountRows.map((r) => [r.campaignId, r.count]))
        const adAccountCountMap = new Map(adAccountCountRows.map((r) => [r.campaignId, r.count]))
        const landingPageCountMap = new Map(landingPageCountRows.map((r) => [r.funnelId, r.count]))

        const campaignCreativeMap = new Map<string, Array<{ id: string; name: string; thumbnailUrl: string | null }>>()
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
            ? (landingPageCountMap.get(item.funnelId) ?? 0)
            : 0
        }
      }

      return {
        items,
        pageCount: Math.ceil(total / perPage),
        total,
      }
    }),

  // ─── My Campaigns: Create & Manage ─────────────────────────────────────

  createCampaign: mediaBuyerProcedure.input(createCampaignSchema).mutation(async ({ ctx, input }) => {
    const { db, mediaBuyer, user } = ctx

    // Permission check — only buyers granted `campaigns.create` may create
    assertBuyerPermission(user, mediaBuyer, "campaigns.create", "You don't have permission to create campaigns")

    const { funnelId, ...data } = input

    // Derive productId from the selected funnel
    const [funnel] = await db
      .select({ productId: funnels.productId })
      .from(funnels)
      .where(eq(funnels.id, funnelId))
      .limit(1)

    if (!funnel) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" })
    }

    // Scope: the campaign's product must be assigned to this media buyer
    const [assignedProduct] = await db
      .select({ productId: productMediaBuyers.productId })
      .from(productMediaBuyers)
      .where(
        and(eq(productMediaBuyers.mediaBuyerId, mediaBuyer.id), eq(productMediaBuyers.productId, funnel.productId))
      )
      .limit(1)

    if (!assignedProduct) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only create campaigns for products assigned to you",
      })
    }

    const [campaign] = await db
      .insert(campaigns)
      .values({ ...data, funnelId, productId: funnel.productId, createdByMediaBuyerId: mediaBuyer.id })
      .returning()

    if (!campaign) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create campaign",
      })
    }

    return campaign
  }),

  campaignAdAccounts: mediaBuyerProcedure.input(z.object({ campaignId: z.string() })).query(async ({ ctx, input }) => {
    const { db, mediaBuyer, user } = ctx
    const { campaignId } = input

    assertBuyerPermission(
      user,
      mediaBuyer,
      "campaigns.view",
      "You don't have permission to manage this campaign's ad accounts"
    )

    // Scope: the campaign must be owned by this buyer or linked to one of
    // their ad accounts (and not soft-deleted).
    const campaignIds = await getAccessibleCampaignIds(db, mediaBuyer.id)
    if (!campaignIds.has(campaignId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this campaign",
      })
    }

    const trackingDomain = env.TRACKING_APP_URL || "http://localhost:3002"

    const accounts = await db
      .select({
        id: adAccounts.id,
        name: adAccounts.name,
        platform: adAccounts.sourcePlatform,
        accountId: adAccounts.accountId,
      })
      .from(adAccounts)
      .where(and(eq(adAccounts.mediaBuyerId, mediaBuyer.id), isNull(adAccounts.deletedAt)))
      .orderBy(asc(adAccounts.name))

    const assignments = await db
      .select({ adAccountId: campaignAdAccounts.adAccountId })
      .from(campaignAdAccounts)
      .where(eq(campaignAdAccounts.campaignId, campaignId))

    const assignedIds = new Set(assignments.map((a) => a.adAccountId))

    return accounts.map((account) => ({
      ...account,
      isAssigned: assignedIds.has(account.id),
      trackingLink: assignedIds.has(account.id) ? `${trackingDomain}/c?c=${campaignId}&aa=${account.id}` : null,
    }))
  }),

  assignAdAccount: mediaBuyerProcedure
    .input(z.object({ campaignId: z.string(), adAccountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { campaignId, adAccountId } = input
      const { db, mediaBuyer, user } = ctx

      assertBuyerPermission(
        user,
        mediaBuyer,
        "campaigns.view",
        "You don't have permission to manage this campaign's ad accounts"
      )

      // Scope: the campaign must be owned by this buyer or linked to one of
      // their ad accounts (and not soft-deleted). A fresh campaign created by
      // the buyer is owned, so the first assignment is always allowed.
      const campaignIds = await getAccessibleCampaignIds(db, mediaBuyer.id)
      if (!campaignIds.has(campaignId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this campaign",
        })
      }

      // Scope: the ad account must belong to this buyer
      const [account] = await db
        .select({ id: adAccounts.id })
        .from(adAccounts)
        .where(and(eq(adAccounts.id, adAccountId), eq(adAccounts.mediaBuyerId, mediaBuyer.id)))
        .limit(1)

      if (!account) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only assign your own ad accounts",
        })
      }

      const trackingDomain = env.TRACKING_APP_URL || "http://localhost:3002"
      const trackingLink = `${trackingDomain}/c?c=${campaignId}&aa=${adAccountId}`

      const [assignment] = await db
        .insert(campaignAdAccounts)
        .values({ campaignId, adAccountId, trackingLink })
        .onConflictDoUpdate({
          target: [campaignAdAccounts.campaignId, campaignAdAccounts.adAccountId],
          set: { trackingLink },
        })
        .returning()

      return assignment
    }),

  removeAdAccount: mediaBuyerProcedure
    .input(z.object({ campaignId: z.string(), adAccountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { campaignId, adAccountId } = input
      const { db, mediaBuyer, user } = ctx

      assertBuyerPermission(
        user,
        mediaBuyer,
        "campaigns.view",
        "You don't have permission to manage this campaign's ad accounts"
      )

      // Scope: the campaign must be owned by this buyer or linked to one of
      // their ad accounts (and not soft-deleted).
      const campaignIds = await getAccessibleCampaignIds(db, mediaBuyer.id)
      if (!campaignIds.has(campaignId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this campaign",
        })
      }

      const [account] = await db
        .select({ id: adAccounts.id })
        .from(adAccounts)
        .where(and(eq(adAccounts.id, adAccountId), eq(adAccounts.mediaBuyerId, mediaBuyer.id)))
        .limit(1)

      if (!account) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only manage your own ad accounts",
        })
      }

      await db
        .delete(campaignAdAccounts)
        .where(and(eq(campaignAdAccounts.campaignId, campaignId), eq(campaignAdAccounts.adAccountId, adAccountId)))

      return { success: true }
    }),

  // ─── My Campaigns: Detail & Edit ────────────────────────────────────────

  campaignById: mediaBuyerProcedure
    .input(z.object({ id: z.string() }))
    .output(campaignOutputSchema)
    .query(async ({ ctx, input }) => {
      const { db, mediaBuyer } = ctx
      const { id } = input

      const campaignIds = await getAccessibleCampaignIds(db, mediaBuyer.id)
      if (!campaignIds.has(id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this campaign",
        })
      }

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
        .where(and(eq(campaigns.id, id), isNull(campaigns.deletedAt)))
        .limit(1)

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" })
      }

      return result
    }),

  campaignStats: mediaBuyerProcedure.input(z.object({ campaignId: z.string() })).query(async ({ ctx, input }) => {
    const { db, mediaBuyer } = ctx
    const { campaignId } = input

    const campaignIds = await getAccessibleCampaignIds(db, mediaBuyer.id)
    if (!campaignIds.has(campaignId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this campaign",
      })
    }

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

    const row = clickStats[0]
    const totalClicks = Number(row?.clicks ?? 0)
    const totalConversions = Number(row?.conversions ?? 0)
    const totalRevenue = Number(row?.revenue ?? 0)
    const totalPayout = Number(row?.payout ?? 0)
    const epc = totalClicks > 0 ? totalPayout / totalClicks : 0

    return {
      clicks: totalClicks,
      conversions: totalConversions,
      revenue: totalRevenue,
      payout: totalPayout,
      epc,
    }
  }),

  updateCampaign: mediaBuyerProcedure
    .input(z.object({ id: z.string(), data: portalUpdateCampaignSchema }))
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input
      const { db, mediaBuyer, user } = ctx

      // Scope: the campaign must be owned by this buyer or linked to one of
      // their ad accounts (and not soft-deleted).
      const campaignIds = await getAccessibleCampaignIds(db, mediaBuyer.id)
      if (!campaignIds.has(id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this campaign",
        })
      }

      // Creator-ownership check: `campaigns.edit` may edit any accessible
      // campaign; a creator holding `campaigns.create` may edit campaigns they
      // created (createdByMediaBuyerId).
      const [campaign] = await db
        .select({ createdByMediaBuyerId: campaigns.createdByMediaBuyerId })
        .from(campaigns)
        .where(and(eq(campaigns.id, id), isNull(campaigns.deletedAt)))
        .limit(1)

      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" })
      }

      assertBuyerCanEditCampaign(user, mediaBuyer, campaign)

      const [updated] = await db
        .update(campaigns)
        .set(data)
        .where(and(eq(campaigns.id, id), isNull(campaigns.deletedAt)))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" })
      }

      return updated
    }),
})