import { and, desc, eq, gte, inArray, isNotNull, lte, sql } from "@adscrush/db/drizzle"
import { categories, clicks, conversions, mediaBuyers, products } from "@adscrush/db/schema"
import { PRODUCT_STATUS } from "@adscrush/shared/constants/status"
import type { Database } from "@adscrush/db"
import type { Scope } from "~/lib/trpc/context"

export interface ScopeConditions {
  advertiserConditions?: ReturnType<typeof inArray>
  mediaBuyerConditions?: ReturnType<typeof inArray>
}

export function buildScopeConditions(scope: Scope): ScopeConditions {
  return {
    advertiserConditions: !scope.isAllAdvertisers
      ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
      : undefined,
    mediaBuyerConditions: !scope.isAllMediaBuyers
      ? inArray(clicks.mediaBuyerId, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
      : undefined,
  }
}

export async function getDashboardStats(
  db: Database,
  dateFrom: Date,
  dateTo: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
      revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
      payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
    })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(
      and(
        gte(clicks.createdAt, dateFrom),
        lte(clicks.createdAt, dateTo),
        eq(products.status, PRODUCT_STATUS.ACTIVE),
        advertiserConditions,
        mediaBuyerConditions
      )
    )
}

export async function getActiveProductsCount(
  db: Database,
  dateTo: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions } = scopeConditions

  return db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(eq(products.status, PRODUCT_STATUS.ACTIVE), lte(products.createdAt, dateTo), advertiserConditions))
}

export async function getRevenueSeries(
  db: Database,
  revenueDateFrom: Date,
  revenueDateTo: Date,
  revenueGroupExpr: ReturnType<typeof sql>,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({
      period: revenueGroupExpr,
      revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
    })
    .from(products)
    .innerJoin(
      clicks,
      and(eq(clicks.productId, products.id), gte(clicks.createdAt, revenueDateFrom), lte(clicks.createdAt, revenueDateTo))
    )
    .leftJoin(
      conversions,
      and(
        eq(conversions.clickId, clicks.id),
        gte(conversions.createdAt, revenueDateFrom),
        lte(conversions.createdAt, revenueDateTo)
      )
    )
    .where(and(eq(products.status, PRODUCT_STATUS.ACTIVE), advertiserConditions, mediaBuyerConditions))
    .groupBy(revenueGroupExpr)
    .orderBy(revenueGroupExpr)
}

export async function getCustomerSegments(
  db: Database,
  dateFrom: Date,
  dateTo: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({
      segment: categories.name,
      count: sql<number>`count(DISTINCT ${conversions.id})`,
    })
    .from(conversions)
    .innerJoin(clicks, eq(conversions.clickId, clicks.id))
    .innerJoin(products, eq(clicks.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        gte(conversions.createdAt, dateFrom),
        lte(conversions.createdAt, dateTo),
        eq(products.status, PRODUCT_STATUS.ACTIVE),
        advertiserConditions,
        mediaBuyerConditions
      )
    )
    .groupBy(categories.id, categories.name)
    .orderBy(desc(sql`count(DISTINCT ${conversions.id})`))
    .limit(3)
}

export async function getGeographyData(
  db: Database,
  dateFrom: Date,
  dateTo: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({
      countryCode: clicks.geoCountry,
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
    })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(
      and(
        gte(clicks.createdAt, dateFrom),
        lte(clicks.createdAt, dateTo),
        eq(products.status, PRODUCT_STATUS.ACTIVE),
        advertiserConditions,
        mediaBuyerConditions
      )
    )
    .groupBy(clicks.geoCountry)
    .orderBy(desc(sql`count(DISTINCT ${clicks.id})`))
    .limit(15)
}

export async function getActiveProductsList(
  db: Database,
  todayStart: Date,
  todayEnd: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({
      id: products.id,
      name: products.name,
      category: categories.name,
      status: products.status,
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
      revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
      payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
      lastConversion: sql<string>`max(${conversions.createdAt})`,
    })
    .from(products)
    .innerJoin(clicks, eq(clicks.productId, products.id))
    .leftJoin(conversions, eq(conversions.clickId, clicks.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.status, PRODUCT_STATUS.ACTIVE),
        gte(clicks.createdAt, todayStart),
        lte(clicks.createdAt, todayEnd),
        advertiserConditions,
        mediaBuyerConditions
      )
    )
    .groupBy(products.id, products.name, categories.id, categories.name)
    .orderBy(desc(sql`count(DISTINCT ${clicks.id})`))
    .limit(5)
}

export async function getBrowserBreakdown(
  db: Database,
  dateFrom: Date,
  dateTo: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({
      browser: clicks.browser,
      clicks: sql<number>`count(DISTINCT ${clicks.id})::int`,
    })
    .from(clicks)
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(
      and(
        gte(clicks.createdAt, dateFrom),
        lte(clicks.createdAt, dateTo),
        isNotNull(clicks.browser),
        advertiserConditions,
        mediaBuyerConditions
      )
    )
    .groupBy(clicks.browser)
    .orderBy(desc(sql`count(DISTINCT ${clicks.id})`))
}

export async function getHourlyData(
  db: Database,
  dateFrom: Date,
  dateTo: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({
      hour: sql<number>`extract(hour from ${clicks.createdAt})::int`,
      minute: sql<number>`extract(minute from ${clicks.createdAt})::int`,
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
    })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(
      and(
        gte(clicks.createdAt, dateFrom),
        lte(clicks.createdAt, dateTo),
        eq(products.status, PRODUCT_STATUS.ACTIVE),
        advertiserConditions,
        mediaBuyerConditions
      )
    )
    .groupBy(sql`extract(hour from ${clicks.createdAt})`, sql`extract(minute from ${clicks.createdAt})`)
    .orderBy(sql`extract(hour from ${clicks.createdAt})`, sql`extract(minute from ${clicks.createdAt})`)
}

export async function getConversionTrend(
  db: Database,
  trendStartDate: Date,
  dateTo: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({
      date: sql<string>`date(${clicks.createdAt})::text`,
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
    })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(
      and(
        gte(clicks.createdAt, trendStartDate),
        lte(clicks.createdAt, dateTo),
        eq(products.status, PRODUCT_STATUS.ACTIVE),
        advertiserConditions,
        mediaBuyerConditions
      )
    )
    .groupBy(sql`date(${clicks.createdAt})`)
    .orderBy(sql`date(${clicks.createdAt})`)
}

export async function getTrafficBySource(
  db: Database,
  dateFrom: Date,
  dateTo: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({
      source: clicks.sourcePlatform,
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
    })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(
      and(
        gte(clicks.createdAt, dateFrom),
        lte(clicks.createdAt, dateTo),
        eq(products.status, PRODUCT_STATUS.ACTIVE),
        isNotNull(clicks.sourcePlatform),
        advertiserConditions,
        mediaBuyerConditions
      )
    )
    .groupBy(clicks.sourcePlatform)
    .orderBy(desc(sql`count(DISTINCT ${clicks.id})`))
    .limit(10)
}

export async function getTopMediaBuyers(
  db: Database,
  dateFrom: Date,
  dateTo: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({
      id: mediaBuyers.id,
      name: mediaBuyers.name,
      email: mediaBuyers.email,
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
      revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
    })
    .from(mediaBuyers)
    .leftJoin(clicks, eq(clicks.mediaBuyerId, mediaBuyers.id))
    .leftJoin(conversions, eq(conversions.clickId, clicks.id))
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(
      and(
        gte(clicks.createdAt, dateFrom),
        lte(clicks.createdAt, dateTo),
        eq(products.status, PRODUCT_STATUS.ACTIVE),
        advertiserConditions,
        mediaBuyerConditions
      )
    )
    .groupBy(mediaBuyers.id, mediaBuyers.name, mediaBuyers.email)
    .orderBy(desc(sql`coalesce(sum(${conversions.revenue}), 0)`))
    .limit(10)
}

export async function getRevenueTrend(
  db: Database,
  from: Date,
  to: Date,
  scopeConditions: ScopeConditions
) {
  const { advertiserConditions, mediaBuyerConditions } = scopeConditions

  return db
    .select({ total: sql<string>`coalesce(sum(${conversions.revenue}), 0)` })
    .from(conversions)
    .innerJoin(clicks, eq(conversions.clickId, clicks.id))
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(
      and(
        gte(conversions.createdAt, from),
        lte(conversions.createdAt, to),
        advertiserConditions,
        mediaBuyerConditions
      )
    )
}
