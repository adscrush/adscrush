import { and, eq, gte, lte, sql } from "@adscrush/db/drizzle"
import {
  advertisers,
  campaigns,
  clicks,
  conversions,
  mediaBuyers,
  productMediaBuyers,
  products,
} from "@adscrush/db/schema"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { csvEscape } from "@adscrush/shared/lib/csv"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"
import { filterColumns } from "@adscrush/db/lib/filter-columns"
import {
  reportBaseQuerySchema,
  reportPerformanceQuerySchema,
  reportPerformanceCountQuerySchema,
  clickLogInputSchema,
  conversionLogInputSchema,
} from "~/modules/reports/reports.types"
import {
  getRange,
  runOverviewQuery,
  runTrendQuery,
  runPerformanceQuery,
  runPerformanceCountQuery,
} from "~/lib/report-utils"
import type { ExtendedColumnFilter } from "@adscrush/shared/types/data-table"

export const portalReportsRouter = router({
  // ─── Report: Overview ───────────────────────────────────────────────────
  reportOverview: mediaBuyerProcedure.input(reportBaseQuerySchema).query(async ({ ctx, input }) => {
    const { period, dateFrom, dateTo, productId } = input
    const { db, mediaBuyer } = ctx

    const { start, end } = getRange(period, dateFrom, dateTo)

    const mbCondition = eq(clicks.mediaBuyerId, mediaBuyer.id)

    const commonConditions = and(
      gte(clicks.createdAt, start),
      lte(clicks.createdAt, end),
      mbCondition,
      productId ? eq(clicks.productId, productId) : undefined
    )

    return await runOverviewQuery(db, commonConditions)
  }),

  // ─── Report: Trend ──────────────────────────────────────────────────────
  reportTrend: mediaBuyerProcedure.input(reportBaseQuerySchema).query(async ({ ctx, input }) => {
    const { period, dateFrom, dateTo, productId } = input
    const { db, mediaBuyer } = ctx

    const { start, end } = getRange(period, dateFrom, dateTo)

    const mbCondition = eq(clicks.mediaBuyerId, mediaBuyer.id)

    const commonConditions = and(
      gte(clicks.createdAt, start),
      lte(clicks.createdAt, end),
      mbCondition,
      productId ? eq(clicks.productId, productId) : undefined
    )

    return await runTrendQuery(db, commonConditions)
  }),

  // ─── Report: Performance ─────────────────────────────────────────────────
  reportPerformance: mediaBuyerProcedure
    .input(reportPerformanceQuerySchema)
    .query(async ({ ctx, input }) => {
      const { period, dateFrom, dateTo, productId, groupBy, page, perPage, sortBy, sortDir, search, breakdownBy } = input
      const { db, mediaBuyer } = ctx

      const { start, end } = getRange(period, dateFrom, dateTo)
      const mbCondition = eq(clicks.mediaBuyerId, mediaBuyer.id)

      const commonConditions = and(
        gte(clicks.createdAt, start),
        lte(clicks.createdAt, end),
        mbCondition,
        productId ? eq(clicks.productId, productId) : undefined,
      )

      const { mapped } = await runPerformanceQuery({
        db,
        conditions: commonConditions,
        groupBy,
        page,
        perPage,
        search,
        sortBy,
        sortDir,
        breakdownBy,
      })

      return mapped
    }),

  // ─── Report: Performance Count ───────────────────────────────────────────
  reportPerformanceCount: mediaBuyerProcedure
    .input(reportPerformanceCountQuerySchema)
    .query(async ({ ctx, input }) => {
      const { period, dateFrom, dateTo, productId, groupBy, search, breakdownBy } = input
      const { db, mediaBuyer } = ctx

      const { start, end } = getRange(period, dateFrom, dateTo)
      const mbCondition = eq(clicks.mediaBuyerId, mediaBuyer.id)

      const commonConditions = and(
        gte(clicks.createdAt, start),
        lte(clicks.createdAt, end),
        mbCondition,
        productId ? eq(clicks.productId, productId) : undefined,
      )

      return await runPerformanceCountQuery(db, commonConditions, groupBy, search, breakdownBy)
    }),

  // ─── Report: Click Log ──────────────────────────────────────────────────
  reportClickLog: mediaBuyerProcedure
    .input(clickLogInputSchema)
    .query(async ({ ctx, input }) => {
      const { filters, joinOperator, page, perPage } = input
      const { db, mediaBuyer } = ctx
      const offset = (page - 1) * perPage

      const mbCondition = eq(clicks.mediaBuyerId, mediaBuyer.id)

      const clickTable = {
        ...clicks,
        productName: products.name,
        mediaBuyerName: mediaBuyers.name,
        advertiserName: advertisers.name,
      }

      const filterConditions = filterColumns({
        table: clickTable,
        filters: filters as ExtendedColumnFilter<unknown>[],
        joinOperator,
        database: "postgres",
      })

      const conditions = and(filterConditions, mbCondition)

      const [items, countResult] = await Promise.all([
        db
          .select({
            id: clicks.id,
            tid: clicks.tid,
            productId: clicks.productId,
            productName: products.name,
            mediaBuyerId: clicks.mediaBuyerId,
            mediaBuyerName: mediaBuyers.name,
            advertiserId: clicks.advertiserId,
            advertiserName: advertisers.name,
            source: clicks.source,
            sourcePlatform: clicks.sourcePlatform,
            adAccountId: clicks.adAccountId,
            campaignId: clicks.campaignId,
            ipAddress: clicks.ipEncrypted,
            geoCountry: clicks.geoCountry,
            deviceType: clicks.deviceType,
            os: clicks.os,
            browser: clicks.browser,
            referer: clicks.referer,
            isUnique: clicks.isUnique,
            createdAt: clicks.createdAt,
          })
          .from(clicks)
          .innerJoin(products, eq(clicks.productId, products.id))
          .leftJoin(mediaBuyers, eq(clicks.mediaBuyerId, mediaBuyers.id))
          .leftJoin(advertisers, eq(clicks.advertiserId, advertisers.id))
          .where(conditions)
          .limit(perPage)
          .offset(offset)
          .orderBy(sql`${clicks.createdAt} DESC`),
        db
          .select({ count: sql<number>`count(*)` })
          .from(clicks)
          .innerJoin(products, eq(clicks.productId, products.id))
          .where(conditions),
      ])

      const total = Number(countResult[0]?.count ?? 0)

      return {
        items,
        pageCount: Math.ceil(total / perPage),
        total,
      }
    }),

  // ─── Report: Click Log Export (server-side CSV) ─────────────────────────
  reportClickLogExport: mediaBuyerProcedure
    .input(clickLogInputSchema.omit({ page: true, perPage: true }))
    .query(async ({ ctx, input }) => {
      const { filters, joinOperator } = input
      const { db, mediaBuyer } = ctx

      const mbCondition = eq(clicks.mediaBuyerId, mediaBuyer.id)

      const clickTable = {
        ...clicks,
        productName: products.name,
      }

      const filterConditions = filterColumns({
        table: clickTable,
        filters: filters as ExtendedColumnFilter<unknown>[],
        joinOperator,
        database: "postgres",
      })

      const conditions = and(filterConditions, mbCondition)

      const rows = await db
        .select({
          id: clicks.id,
          tid: clicks.tid,
          productId: clicks.productId,
          productName: products.name,
          source: clicks.source,
          sourcePlatform: clicks.sourcePlatform,
          adAccountId: clicks.adAccountId,
          campaignId: clicks.campaignId,
          geoCountry: clicks.geoCountry,
          geoCity: clicks.geoCity,
          geoState: clicks.geoState,
          deviceType: clicks.deviceType,
          os: clicks.os,
          browser: clicks.browser,
          referer: clicks.referer,
          ipEncrypted: clicks.ipEncrypted,
          isUnique: clicks.isUnique,
          createdAt: clicks.createdAt,
        })
        .from(clicks)
        .innerJoin(products, eq(clicks.productId, products.id))
        .where(conditions)
        .limit(100000)
        .orderBy(sql`${clicks.createdAt} DESC`)

      const header = "ID,Click ID,Product,Source,Platform,Ad Account,Campaign,Country,City,State,Device,OS,Browser,Referer,IP,Is Unique,Date\n"
      const csvRows = rows.map((r) =>
        [r.id, r.tid, r.productName, r.source, r.sourcePlatform ?? "", r.adAccountId ?? "", r.campaignId ?? "", r.geoCountry ?? "", r.geoCity ?? "", r.geoState ?? "", r.deviceType ?? "", r.os ?? "", r.browser ?? "", r.referer ?? "", "", r.isUnique ? "Yes" : "No", r.createdAt?.toISOString() ?? ""]
          .map(csvEscape)
          .join(",")
      ).join("\n")

      return header + csvRows
    }),

  // ─── Report: Conversion Log Export (server-side CSV) ─────────────────────
  reportConversionLogExport: mediaBuyerProcedure
    .input(conversionLogInputSchema.omit({ page: true, perPage: true }))
    .query(async ({ ctx, input }) => {
      const { filters, joinOperator } = input
      const { db, mediaBuyer } = ctx

      const mbCondition = eq(clicks.mediaBuyerId, mediaBuyer.id)

      const clickTable = {
        ...clicks,
        productName: products.name,
        campaignName: campaigns.name,
      }

      const filterConditions = filterColumns({
        table: clickTable,
        filters: filters as ExtendedColumnFilter<unknown>[],
        joinOperator,
        database: "postgres",
      })

      const conditions = and(filterConditions, mbCondition)

      const rows = await db
        .select({
          id: conversions.id,
          clickId: clicks.tid, // Public click id (TID) shown in the grid
          productName: products.name,
          campaignName: campaigns.name,
          mediaBuyerName: mediaBuyers.name,
          advertiserName: advertisers.name,
          event: conversions.event,
          payout: conversions.payout,
          revenue: conversions.revenue,
          saleAmount: conversions.saleAmount,
          currency: conversions.currency,
          status: conversions.status,
          isDuplicate: conversions.isDuplicate,
          method: conversions.method,
          createdAt: conversions.createdAt,
        })
        .from(conversions)
        .innerJoin(clicks, eq(conversions.clickId, clicks.id))
        .innerJoin(products, eq(clicks.productId, products.id))
        .leftJoin(campaigns, eq(clicks.campaignId, campaigns.id))
        .leftJoin(mediaBuyers, eq(clicks.mediaBuyerId, mediaBuyers.id))
        .leftJoin(advertisers, eq(clicks.advertiserId, advertisers.id))
        .where(conditions)
        .limit(100000)
        .orderBy(sql`${conversions.createdAt} DESC`)

      const header = "ID,Click ID,Product,Campaign,Media Buyer,Advertiser,Event,Payout,Revenue,Sale Amount,Currency,Status,Duplicate,Method,Date\n"
      const csvRows = rows.map((r) =>
        [r.id, r.clickId, r.productName, r.campaignName ?? "", r.mediaBuyerName ?? "", r.advertiserName ?? "", r.event, r.payout, r.revenue, r.saleAmount ?? "", r.currency, r.status, r.isDuplicate ? "Yes" : "No", r.method, r.createdAt?.toISOString() ?? ""]
          .map(csvEscape)
          .join(",")
      ).join("\n")

      return header + csvRows
    }),

  // ─── Media Buyer Assignment Management ───────────────────────────────────
  myProductMediaBuyers: mediaBuyerProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, mediaBuyer } = ctx
      const { productId } = input

      // Verify this product is assigned to the current media buyer
      const [assignment] = await db
        .select({ id: productMediaBuyers.id })
        .from(productMediaBuyers)
        .where(
          and(eq(productMediaBuyers.productId, productId), eq(productMediaBuyers.mediaBuyerId, mediaBuyer.id))
        )
        .limit(1)

      if (!assignment) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this product" })
      }

      // Get all media buyers assigned to this product
      const rows = await db
        .select({
          id: productMediaBuyers.id,
          mediaBuyerId: productMediaBuyers.mediaBuyerId,
          name: mediaBuyers.name,
          status: productMediaBuyers.status,
          createdAt: productMediaBuyers.createdAt,
        })
        .from(productMediaBuyers)
        .innerJoin(mediaBuyers, eq(productMediaBuyers.mediaBuyerId, mediaBuyers.id))
        .where(eq(productMediaBuyers.productId, productId))

      return rows.map((row) => ({
        ...row,
        isCurrentUser: row.mediaBuyerId === mediaBuyer.id,
      }))
    }),

  leaveProduct: mediaBuyerProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, mediaBuyer } = ctx

      await db
        .delete(productMediaBuyers)
        .where(
          and(eq(productMediaBuyers.mediaBuyerId, mediaBuyer.id), eq(productMediaBuyers.productId, input.productId))
        )

      return { success: true }
    }),
})
