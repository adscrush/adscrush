import { and, desc, eq, gte, lte, isNotNull, isNull, sql, inArray } from "@adscrush/db/drizzle"
import {
  adAccounts,
  categories,
  clicks,
  conversions,
  products,
} from "@adscrush/db/schema"
import { z } from "zod"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"
import { getRevenueSeriesConfig, backfillRevenueSeries } from "~/lib/dashboard-helpers"

export const portalDashboardRouter = router({

  // ─── Dashboard Overview ------------------------------------------------------------------

  dashboard: mediaBuyerProcedure
    .input(
      z.object({
        dateFrom: z.string().refine((v) => !isNaN(new Date(v).getTime()), {
          message: "Must be a valid ISO date string",
        }),
        dateTo: z.string().refine((v) => !isNaN(new Date(v).getTime()), {
          message: "Must be a valid ISO date string",
        }),
        timezoneOffset: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, mediaBuyer } = ctx
      const { dateFrom: dateFromStr, dateTo: dateToStr, timezoneOffset } = input
      const tzOffset = timezoneOffset ?? 0
      const now = new Date()

      // --- Date range helpers --------------------------------------------------
      const msPerDay = 24 * 60 * 60 * 1000
      const dateFrom = new Date(dateFromStr)
      const dateTo = new Date(dateToStr)
      dateFrom.setHours(0, 0, 0, 0)
      dateTo.setHours(23, 59, 59, 999)

      const getPreviousPeriod = (currentFrom: Date, currentTo: Date) => {
        const durationMs = currentTo.getTime() - currentFrom.getTime()
        const prevTo = new Date(currentFrom.getTime() - 1)
        const prevFrom = new Date(prevTo.getTime() - durationMs)
        return { from: prevFrom, to: prevTo }
      }

      const { from: prevDateFrom, to: prevDateTo } = getPreviousPeriod(dateFrom, dateTo)

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      // --- Scope: ad accounts & campaigns for this media buyer -----------------
      const accounts = await db
        .select({
          id: adAccounts.id,
          name: adAccounts.name,
          sourcePlatform: adAccounts.sourcePlatform,
          status: adAccounts.status,
        })
        .from(adAccounts)
        .where(and(eq(adAccounts.mediaBuyerId, mediaBuyer.id), isNull(adAccounts.deletedAt)))

      const accountIds = accounts.map((a) => a.id)

      // --- Shared conditions ---------------------------------------------------
      const mbCondition = eq(clicks.mediaBuyerId, mediaBuyer.id)
      const periodCondition = and(gte(clicks.createdAt, dateFrom), lte(clicks.createdAt, dateTo))
      const prevPeriodCondition = and(gte(clicks.createdAt, prevDateFrom), lte(clicks.createdAt, prevDateTo))
      const todayCondition = and(gte(clicks.createdAt, todayStart), lte(clicks.createdAt, todayEnd))

      const pctChange = (curr: number, prev: number) =>
        Math.abs(prev) > 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0

      // ── Revenue series: month-to-date for short periods, 12-month for long periods ──
      const { isDailyRevenue, revenueDateFrom, revenueDateTo, revenueGroupExpr } = getRevenueSeriesConfig(
        dateFrom,
        dateTo,
        tzOffset
      )
      const revenueCondition = and(gte(clicks.createdAt, revenueDateFrom), lte(clicks.createdAt, revenueDateTo))

      // --- A) Current & previous period stats + revenue series ---
      const [currStats, prevStats, rawRevenueSeries] = await Promise.all([
        db
          .select({
            clicks: sql<number>`count(DISTINCT ${clicks.id})::int`,
            conversions: sql<number>`count(DISTINCT ${conversions.id})::int`,
            revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
            payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
          })
          .from(clicks)
          .leftJoin(conversions, eq(clicks.id, conversions.clickId))
          .where(and(mbCondition, periodCondition)),
        db
          .select({
            clicks: sql<number>`count(DISTINCT ${clicks.id})::int`,
            conversions: sql<number>`count(DISTINCT ${conversions.id})::int`,
            revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
            payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
          })
          .from(clicks)
          .leftJoin(conversions, eq(clicks.id, conversions.clickId))
          .where(and(mbCondition, prevPeriodCondition)),
        // Revenue Series — month-to-date for short periods, 12-month for long periods
        db
          .select({
            period: revenueGroupExpr,
            revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
            clicks: sql<number>`count(DISTINCT ${clicks.id})::int`,
            conversions: sql<number>`count(DISTINCT ${conversions.id})::int`,
          })
          .from(clicks)
          .leftJoin(conversions, eq(clicks.id, conversions.clickId))
          .where(and(mbCondition, revenueCondition))
          .groupBy(revenueGroupExpr)
          .orderBy(revenueGroupExpr),
      ])

      const totalClicks = Number(currStats[0]?.clicks ?? 0)
      const totalConversions = Number(currStats[0]?.conversions ?? 0)
      const totalRevenue = Number(currStats[0]?.revenue ?? 0)
      const totalPayout = Number(currStats[0]?.payout ?? 0)
      const totalProfit = totalRevenue - totalPayout
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
      const prevClicks = Number(prevStats[0]?.clicks ?? 0)
      const prevConversions = Number(prevStats[0]?.conversions ?? 0)
      const prevRevenue = Number(prevStats[0]?.revenue ?? 0)
      const prevPayout = Number(prevStats[0]?.payout ?? 0)
      const prevProfit = prevRevenue - prevPayout
      const prevConversionRate = prevClicks > 0 ? (prevConversions / prevClicks) * 100 : 0

      const revenueByPeriod = backfillRevenueSeries(rawRevenueSeries, isDailyRevenue, dateFrom, dateTo, tzOffset)

      // --- C) Daily trend data (last 30 days) ---------------------------------
      const thirtyDaysAgo = new Date(now.getTime() - 30 * msPerDay)
      const dailyTrends = await db
        .select({
          date: sql<string>`to_char(date(${clicks.createdAt}), 'YYYY-MM-DD')`,
          clicks: sql<number>`count(DISTINCT ${clicks.id})::int`,
          conversions: sql<number>`count(DISTINCT ${conversions.id})::int`,
        })
        .from(clicks)
        .leftJoin(conversions, eq(clicks.id, conversions.clickId))
        .where(and(mbCondition, gte(clicks.createdAt, thirtyDaysAgo), lte(clicks.createdAt, todayEnd)))
        .groupBy(sql`date(${clicks.createdAt})`)
        .orderBy(sql`date(${clicks.createdAt})`)

      // --- D) Customer segments (top categories) ------------------------------
      const segmentsResult = await db
        .select({
          segment: categories.name,
          count: sql<number>`count(DISTINCT ${conversions.id})::int`,
        })
        .from(conversions)
        .innerJoin(clicks, eq(conversions.clickId, clicks.id))
        .innerJoin(products, eq(clicks.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(mbCondition, periodCondition))
        .groupBy(categories.id, categories.name)
        .orderBy(desc(sql`count(DISTINCT ${conversions.id})`))
        .limit(3)

      const prevSegmentsResult = await db
        .select({
          segment: categories.name,
          count: sql<number>`count(DISTINCT ${conversions.id})::int`,
        })
        .from(conversions)
        .innerJoin(clicks, eq(conversions.clickId, clicks.id))
        .innerJoin(products, eq(clicks.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(mbCondition, prevPeriodCondition))
        .groupBy(categories.id, categories.name)

      const prevCounts = new Map()
      prevSegmentsResult.forEach((row) => {
        if (row.segment) prevCounts.set(row.segment, Number(row.count ?? 0))
      })

      const totalConvForShare = segmentsResult.reduce((sum, row) => sum + Number(row.count ?? 0), 0)
      const grayscale = ["#9CA3AF", "#6B7280", "#374151"]
      const customerSegments = segmentsResult.map((row, index) => {
        const count = Number(row.count ?? 0)
        const share = totalConvForShare > 0 ? (count / totalConvForShare) * 100 : 0
        const prevCount = prevCounts.get(row.segment ?? "") ?? 0
        const trend = prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : 0
        return {
          segment: row.segment ?? "Uncategorized",
          count,
          trend,
          color: grayscale[index % grayscale.length],
          share,
        }
      })

      // --- E) Geography (current period) --------------------------------------
      const geoResult = await db
        .select({
          countryCode: clicks.geoCountry,
          clicks: sql<number>`count(DISTINCT ${clicks.id})::int`,
          conversions: sql<number>`count(DISTINCT ${conversions.id})::int`,
        })
        .from(clicks)
        .leftJoin(conversions, eq(clicks.id, conversions.clickId))
        .where(and(mbCondition, periodCondition))
        .groupBy(clicks.geoCountry)
        .orderBy(desc(sql`count(DISTINCT ${clicks.id})`))
        .limit(15)

      const geography = geoResult.map((row) => ({
        countryCode: row.countryCode ?? "unknown",
        total: Number(row.clicks ?? 0),
        clicks: Number(row.clicks ?? 0),
        conversions: Number(row.conversions ?? 0),
        countryName: "",
        flag: "",
        lat: 0,
        lng: 0,
      }))

      // --- G) Per-ad-account stats --------------------------------------------
      const accountStats =
        accountIds.length > 0
          ? await db
              .select({
                adAccountId: clicks.adAccountId,
                clicks: sql<number>`count(DISTINCT ${clicks.id})::int`,
                conversions: sql<number>`count(DISTINCT ${conversions.id})::int`,
                revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
                payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
              })
              .from(clicks)
              .leftJoin(conversions, eq(clicks.id, conversions.clickId))
              .where(and(mbCondition, inArray(clicks.adAccountId, accountIds), periodCondition))
              .groupBy(clicks.adAccountId)
          : []

      const statsMap = new Map(accountStats.map((s) => [s.adAccountId, s]))

      // --- H) Revenue comparisons ---------------------------------------------
      const getRevenueTrend = async (days: number) => {
        const f = new Date(now.getTime() - days * msPerDay)
        const t = now
        const pf = new Date(f.getTime() - days * msPerDay)
        const pt = new Date(f.getTime() - 1)
        const [curr, prev] = await Promise.all([
          db
            .select({ total: sql<string>`coalesce(sum(${conversions.revenue}), 0)` })
            .from(conversions)
            .innerJoin(clicks, eq(conversions.clickId, clicks.id))
            .where(and(mbCondition, gte(conversions.createdAt, f), lte(conversions.createdAt, t))),
          db
            .select({ total: sql<string>`coalesce(sum(${conversions.revenue}), 0)` })
            .from(conversions)
            .innerJoin(clicks, eq(conversions.clickId, clicks.id))
            .where(and(mbCondition, gte(conversions.createdAt, pf), lte(conversions.createdAt, pt))),
        ])
        const c = Number(curr[0]?.total ?? 0)
        const p = Number(prev[0]?.total ?? 0)
        return p > 0 ? ((c - p) / p) * 100 : 0
      }

      const [rev4w, rev13w, rev12m] = await Promise.all([
        getRevenueTrend(28),
        getRevenueTrend(91),
        getRevenueTrend(365),
      ])

      // --- Browser breakdown ---------------------------------------------------
      const browserBreakdownRaw = await db
        .select({
          browser: clicks.browser,
          clicks: sql<number>`count(DISTINCT ${clicks.id})::int`,
        })
        .from(clicks)
        .where(and(mbCondition, periodCondition, isNotNull(clicks.browser)))
        .groupBy(clicks.browser)
        .orderBy(desc(sql`count(DISTINCT ${clicks.id})`))

      const browserBreakdown = browserBreakdownRaw
        .filter((row) => row.browser !== null)
        .map((row) => ({
          browser: row.browser!,
          clicks: row.clicks,
        }))

      // --- J) Hourly Breakdown (clicks & conversions by hour) ------------------
      const hourlyRaw = await db
        .select({
          hour: sql<number>`extract(hour from ${clicks.createdAt})::int`,
          clicks: sql<number>`count(DISTINCT ${clicks.id})`,
          conversions: sql<number>`count(DISTINCT ${conversions.id})`,
        })
        .from(clicks)
        .leftJoin(conversions, eq(clicks.id, conversions.clickId))
        .where(and(mbCondition, periodCondition))
        .groupBy(sql`extract(hour from ${clicks.createdAt})`)
        .orderBy(sql`extract(hour from ${clicks.createdAt})`)

      const hourlyMap = new Map<number, { hour: number; clicks: number; conversions: number }>()
      for (const row of hourlyRaw) {
        hourlyMap.set(row.hour, { hour: row.hour, clicks: Number(row.clicks), conversions: Number(row.conversions) })
      }
      const hourlyData = Array.from(
        { length: 24 },
        (_, i) => hourlyMap.get(i) ?? { hour: i, clicks: 0, conversions: 0 }
      )

      // --- K) Daily Conversion Trend (CR% over last 30 days) -------------------
      const trendStartDate = new Date(now.getTime() - 30 * msPerDay)
      const conversionTrendRaw = await db
        .select({
          date: sql<string>`date(${clicks.createdAt})::text`,
          clicks: sql<number>`count(DISTINCT ${clicks.id})`,
          conversions: sql<number>`count(DISTINCT ${conversions.id})`,
        })
        .from(clicks)
        .leftJoin(conversions, eq(clicks.id, conversions.clickId))
        .where(and(mbCondition, gte(clicks.createdAt, trendStartDate), lte(clicks.createdAt, dateTo)))
        .groupBy(sql`date(${clicks.createdAt})`)
        .orderBy(sql`date(${clicks.createdAt})`)

      const conversionTrend = conversionTrendRaw.map((row) => {
        const c = Number(row.clicks)
        return {
          date: row.date,
          clicks: c,
          conversions: Number(row.conversions),
          cr: c > 0 ? (Number(row.conversions) / c) * 100 : 0,
        }
      })

      // --- I) Active products (today) -----------------------------------------
      const activeProductsListRaw = await db
        .select({
          id: products.id,
          name: products.name,
          category: categories.name,
          status: products.status,
          clicks: sql<number>`count(DISTINCT ${clicks.id})::int`,
          conversions: sql<number>`count(DISTINCT ${conversions.id})::int`,
          revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
          payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
          lastConversion: sql<string>`max(${conversions.createdAt})`,
        })
        .from(products)
        .innerJoin(clicks, eq(clicks.productId, products.id))
        .leftJoin(conversions, eq(conversions.clickId, clicks.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(mbCondition, todayCondition))
        .groupBy(products.id, products.name, categories.id, categories.name)
        .orderBy(desc(sql`count(DISTINCT ${clicks.id})`))
        .limit(5)

      // --- Return -------------------------------------------------------------
      return {
        revenueMode: isDailyRevenue ? ("daily" as const) : ("monthly" as const),
        summary: {
          totalClicks,
          totalConversions,
          totalRevenue,
          totalPayout,
          profit: totalProfit,
          conversionRate,
          activeProducts: activeProductsListRaw.length,
          currency: "USD",
        },
        trends: {
          revenueChange: pctChange(totalRevenue, prevRevenue),
          conversionsChange: pctChange(totalConversions, prevConversions),
          clicksChange: pctChange(totalClicks, prevClicks),
          payoutChange: pctChange(totalPayout, prevPayout),
          profitChange: pctChange(totalProfit, prevProfit),
          conversionRateChange: pctChange(conversionRate, prevConversionRate),
          revenueComparisons: { "4w": rev4w, "13w": rev13w, "12m": rev12m },
        },
        revenueByPeriod,
        customerSegments,
        dailyTrends: dailyTrends.map((d) => ({
          date: d.date,
          clicks: d.clicks,
          conversions: d.conversions,
        })),
        geography,
        activeProductsList: activeProductsListRaw.map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category ?? "Uncategorized",
          status: row.status,
          clicks: Number(row.clicks ?? 0),
          conversions: Number(row.conversions ?? 0),
          revenue: Number(row.revenue ?? 0),
          payout: Number(row.payout ?? 0),
          lastConversion: row.lastConversion,
        })),
        browserBreakdown,
        hourlyData,
        conversionTrend,
        accounts: accounts.map((a) => {
          const s = statsMap.get(a.id)
          return {
            ...a,
            clicks: Number(s?.clicks ?? 0),
            conversions: Number(s?.conversions ?? 0),
            revenue: Number(s?.revenue ?? 0),
            payout: Number(s?.payout ?? 0),
          }
        }),
      }
    }),
})