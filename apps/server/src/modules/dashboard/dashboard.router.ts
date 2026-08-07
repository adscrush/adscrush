import { protectedProcedure, router } from "~/lib/trpc/init"
import { getScope } from "~/lib/scope"
import { dashboardQuerySchema } from "./dashboard.types"
import * as repository from "./dashboard.repository"
import * as service from "./dashboard.service"

export const dashboardRouter = router({
  stats: protectedProcedure.input(dashboardQuerySchema).query(async ({ ctx, input }) => {
    const { dateFrom: dateFromStr, dateTo: dateToStr, timezoneOffset } = input
    const tzOffset = timezoneOffset ?? 0
    const { db, user } = ctx

    const scope = await getScope(db, user.id, user.role)
    const { dateFrom, dateTo } = service.getDateRange(dateFromStr, dateToStr)
    const { todayStart, todayEnd } = service.getTodayRange()
    const { from: prevDateFrom, to: prevDateTo } = service.getPreviousPeriod(dateFrom, dateTo)

    const scopeConditions = repository.buildScopeConditions(scope)

    // Execute all queries in parallel
    const [currStats, prevStats, currProducts, prevProducts, rawRevenueSeries] =
      await Promise.all([
        repository.getDashboardStats(db, dateFrom, dateTo, scopeConditions),
        repository.getDashboardStats(db, prevDateFrom, prevDateTo, scopeConditions),
        repository.getActiveProductsCount(db, dateTo, scopeConditions),
        repository.getActiveProductsCount(db, prevDateTo, scopeConditions),
        (() => {
          const { revenueDateFrom, revenueDateTo, revenueGroupExpr } =
            service.getRevenueSeriesConfig(dateFrom, dateTo, tzOffset)
          return repository.getRevenueSeries(db, revenueDateFrom, revenueDateTo, revenueGroupExpr, scopeConditions)
        })(),
      ])

    // Extract summary metrics
    const totalClicks = Number(currStats[0]?.clicks ?? 0)
    const totalConversions = Number(currStats[0]?.conversions ?? 0)
    const totalRevenue = Number(currStats[0]?.revenue ?? 0)
    const totalPayout = Number(currStats[0]?.payout ?? 0)
    const activeProducts = Number(currProducts[0]?.count ?? 0)
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
    const prevClicks = Number(prevStats[0]?.clicks ?? 0)
    const prevConversions = Number(prevStats[0]?.conversions ?? 0)
    const prevRevenue = Number(prevStats[0]?.revenue ?? 0)
    const prevPayout = Number(prevStats[0]?.payout ?? 0)
    const prevActiveProducts = Number(prevProducts[0]?.count ?? 0)
    const totalProfit = totalRevenue - totalPayout
    const prevProfit = prevRevenue - prevPayout

    const { isDailyRevenue } = service.getRevenueSeriesConfig(dateFrom, dateTo, tzOffset)
    const revenueByPeriod = service.backfillRevenueSeries(
      rawRevenueSeries as { period: string | null; revenue: string | null; clicks: number | null; conversions: number | null }[],
      isDailyRevenue, dateFrom, dateTo, tzOffset
    )

    // Execute remaining queries in parallel
    const [segmentsResult, prevSegmentsResult, geoResult, activeProductsListRaw, browserBreakdownRaw, hourlyRaw, conversionTrendRaw, trafficBySourceRaw, topMediaBuyersRaw] =
      await Promise.all([
        repository.getCustomerSegments(db, dateFrom, dateTo, scopeConditions),
        repository.getCustomerSegments(db, prevDateFrom, prevDateTo, scopeConditions),
        repository.getGeographyData(db, dateFrom, dateTo, scopeConditions),
        repository.getActiveProductsList(db, todayStart, todayEnd, scopeConditions),
        repository.getBrowserBreakdown(db, dateFrom, dateTo, scopeConditions),
        repository.getHourlyData(db, dateFrom, dateTo, scopeConditions),
        repository.getConversionTrend(db, new Date(service.getNowTs() - 30 * 24 * 60 * 60 * 1000), dateTo, scopeConditions),
        repository.getTrafficBySource(db, dateFrom, dateTo, scopeConditions),
        repository.getTopMediaBuyers(db, dateFrom, dateTo, scopeConditions),
      ])

    // Transform results
    const customerSegments = service.transformCustomerSegments(segmentsResult, prevSegmentsResult, totalConversions)
    const geography = service.transformGeographyData(geoResult)
    const activeProductsList = service.transformActiveProductsList(activeProductsListRaw)
    const browserBreakdown = service.transformBrowserBreakdown(browserBreakdownRaw)
    const hourlyData = service.transformHourlyData(hourlyRaw, tzOffset)
    const conversionTrend = service.transformConversionTrend(conversionTrendRaw)
    const trafficBySource = service.transformTrafficBySource(trafficBySourceRaw)
    const topMediaBuyers = service.transformTopMediaBuyers(topMediaBuyersRaw)

    // Calculate revenue trends
    const nowTs = service.getNowTs()
    const [rev4w, rev13w, rev12m] = await Promise.all([
      service.getRevenueTrendForPeriod(db, nowTs, 28, scopeConditions),
      service.getRevenueTrendForPeriod(db, nowTs, 91, scopeConditions),
      service.getRevenueTrendForPeriod(db, nowTs, 365, scopeConditions),
    ])

    const prevConversionRate = prevClicks > 0 ? (prevConversions / prevClicks) * 100 : 0

    return {
      summary: {
        totalRevenue,
        totalPayout,
        totalProfit,
        conversionRate,
        activeProducts,
        totalConversions,
        totalClicks,
        currency: "USD",
      },
      trends: {
        revenueChange: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
        conversionsChange: prevConversions > 0 ? ((totalConversions - prevConversions) / prevConversions) * 100 : 0,
        activeProductsChange: prevActiveProducts > 0 ? ((activeProducts - prevActiveProducts) / prevActiveProducts) * 100 : 0,
        clicksChange: prevClicks > 0 ? ((totalClicks - prevClicks) / prevClicks) * 100 : 0,
        conversionRateChange:
          prevConversionRate > 0 ? ((conversionRate - prevConversionRate) / prevConversionRate) * 100 : 0,
        profitChange: prevProfit > 0 ? ((totalProfit - prevProfit) / prevProfit) * 100 : 0,
        revenueComparisons: { "4w": rev4w, "13w": rev13w, "12m": rev12m },
      },
      revenueMode: isDailyRevenue ? ("daily" as const) : ("monthly" as const),
      revenueByPeriod,
      customerSegments,
      geography,
      activeProductsList,
      browserBreakdown,
      hourlyData,
      conversionTrend,
      trafficBySource,
      topMediaBuyers,
    }
  }),
})
