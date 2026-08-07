import { eq, sql, type SQL } from "@adscrush/db/drizzle"
import { clicks, conversions, products } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"

export async function runOverviewQuery(db: Database, conditions: SQL | undefined) {
  const stats = await db
    .select({
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      uniqueClicks: sql<number>`count(DISTINCT case when ${clicks.isUnique} then ${clicks.id} end)`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
      approvedConversions: sql<number>`count(DISTINCT case when ${conversions.status} = 'approved' then ${conversions.id} end)`,
      revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
      payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
    })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(conditions)

  const row = stats[0]
  const clicksCount = Number(row?.clicks ?? 0)
  const conversionsCount = Number(row?.conversions ?? 0)
  const revenue = Number(row?.revenue ?? 0)
  const payout = Number(row?.payout ?? 0)

  return {
    clicks: clicksCount,
    uniqueClicks: Number(row?.uniqueClicks ?? 0),
    conversions: conversionsCount,
    approvedConversions: Number(row?.approvedConversions ?? 0),
    revenue,
    payout,
    profit: revenue - payout,
    cr: clicksCount > 0 ? (conversionsCount / clicksCount) * 100 : 0,
    rpc: clicksCount > 0 ? revenue / clicksCount : 0,
    epc: clicksCount > 0 ? payout / clicksCount : 0,
  }
}

export async function runTrendQuery(db: Database, conditions: SQL | undefined) {
  const results = await db
    .select({
      date: sql<string>`date(${clicks.createdAt})::text`,
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
      revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
      payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
    })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(conditions)
    .groupBy(sql`date(${clicks.createdAt})`)
    .orderBy(sql`date(${clicks.createdAt})`)

  return results.map((row) => ({
    date: row.date,
    clicks: Number(row.clicks),
    conversions: Number(row.conversions),
    revenue: Number(row.revenue),
    payout: Number(row.payout),
  }))
}
