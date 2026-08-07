import { and, asc, desc, eq, gte, ilike, lte, sql, inArray, type SQL } from "@adscrush/db/drizzle"
import {
  clicks,
  conversions,
  products,
  adAccountSpend,
} from "@adscrush/db/schema"
import { getGroupByColumns, BREAKDOWN_FIELDS, type DrizzleColumn, type PerformanceResultRow, type PerformanceQueryRow, type PerformanceQueryOptions, type TableLike } from "./registry"
import type { Database } from "@adscrush/db"

// ─── Performance result row builder ───────────────────────────────────────

export function buildPerformanceResult(
  row: PerformanceQueryRow,
  breakdownBy?: string[],
): PerformanceResultRow {
  const clicksCount = Number(row.clicks ?? 0)
  const conversionsCount = Number(row.conversions ?? 0)
  const revenue = Number(row.revenue ?? 0)
  const payout = Number(row.payout ?? 0)

  const result: PerformanceResultRow = {
    id: row.id,
    name: row.name ?? "Unknown",
    clicks: clicksCount,
    uniqueClicks: Number(row.uniqueClicks ?? 0),
    conversions: conversionsCount,
    approvedConversions: Number(row.approvedConversions ?? 0),
    revenue,
    payout,
    profit: revenue - payout,
    cr: clicksCount > 0 ? (conversionsCount / clicksCount) * 100 : 0,
    rpc: clicksCount > 0 ? revenue / clicksCount : 0,
    epc: clicksCount > 0 ? payout / clicksCount : 0,
  }

  if (breakdownBy) {
    for (const field of breakdownBy) {
      const nameKey = `${field}Name`
      if (row[nameKey] !== undefined && row[nameKey] !== null) {
        ;(result as Record<string, unknown>)[nameKey] = String(row[nameKey])
      }
    }
  }

  return result
}

// ─── Ad Account spend enrichment ───────────────────────────────────────────

export async function fetchAdAccountSpend(
  db: Database,
  mapped: PerformanceResultRow[],
  start: Date,
  end: Date,
): Promise<PerformanceResultRow[]> {
  const adAccountIds = mapped.map((r) => r.id).filter((v): v is string => Boolean(v))
  if (adAccountIds.length === 0) return mapped

  const spendData = await db
    .select({
      adAccountId: adAccountSpend.adAccountId,
      totalSpend: sql<string>`coalesce(sum(${adAccountSpend.spend}), 0)`,
    })
    .from(adAccountSpend)
    .where(
      and(
        inArray(adAccountSpend.adAccountId, adAccountIds),
        gte(adAccountSpend.date, start.toISOString().split("T")[0]!),
        lte(adAccountSpend.date, end.toISOString().split("T")[0]!),
      ),
    )
    .groupBy(adAccountSpend.adAccountId)

  const spendMap = new Map<string, number>(spendData.map((s) => [s.adAccountId, Number(s.totalSpend)]))

  return mapped.map((r: PerformanceResultRow) => {
    const spend: number = (r.id ? (spendMap.get(r.id) ?? 0) : 0)
    return { ...r, spend, roas: spend > 0 ? r.revenue / spend : 0 }
  })
}

// ─── Performance query executor ────────────────────────────────────────────

export async function runPerformanceQuery(
  opts: PerformanceQueryOptions,
): Promise<{ mapped: PerformanceResultRow[]; idCol: DrizzleColumn; nameCol: DrizzleColumn; joinTable?: TableLike; joinCond?: SQL | undefined; commonConditions: SQL | undefined }> {
  const { db, conditions, groupBy, page, perPage, search, sortBy, sortDir, breakdownBy, useAdvertiserTable, spendStart, spendEnd } = opts

  const { idCol, nameCol, joinTable, joinCond, isAdAccountGroup } = getGroupByColumns(groupBy, { useAdvertiserTable })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakdownSelectExt: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakdownGroupByExt: any[] = []
  const breakdownJoinTables: Array<{ table: TableLike; cond: SQL | undefined }> = []

  if (breakdownBy && breakdownBy.length > 0) {
    const appliedJoins = new Set<string>()
    for (const field of breakdownBy) {
      const bd = BREAKDOWN_FIELDS[field]
      if (!bd) continue
      const nameKey = `${field}Name`
      breakdownSelectExt[nameKey] = bd.nameExpr
      breakdownGroupByExt.push(bd.nameExpr)
      if (bd.joinTable && bd.joinCond) {
        const idKey = `${field}Id`
        breakdownSelectExt[idKey] = bd.idExpr
        breakdownGroupByExt.push(bd.idExpr)
        if (!appliedJoins.has(field)) {
          appliedJoins.add(field)
          breakdownJoinTables.push({ table: bd.joinTable, cond: bd.joinCond })
        }
      } else {
        const idKey = `${field}Id`
        breakdownSelectExt[idKey] = bd.idExpr
        breakdownGroupByExt.push(bd.idExpr)
      }
    }
  }

  const query = db
    .select({
      id: idCol,
      name: nameCol,
      clicks: sql<number>`count(DISTINCT ${clicks.id})`,
      uniqueClicks: sql<number>`count(DISTINCT case when ${clicks.isUnique} then ${clicks.id} end)`,
      conversions: sql<number>`count(DISTINCT ${conversions.id})`,
      approvedConversions: sql<number>`count(DISTINCT case when ${conversions.status} = 'approved' then ${conversions.id} end)`,
      revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
      payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
      ...breakdownSelectExt,
    })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .innerJoin(products, eq(clicks.productId, products.id))

  if (joinTable && joinCond) query.leftJoin(joinTable, joinCond)
  for (const j of breakdownJoinTables) query.leftJoin(j.table, j.cond)

  const searchConditions = search ? and(conditions, ilike(nameCol, `%${search}%`)) : conditions

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortColumnMap: Record<string, any> = {
    name: nameCol,
    clicks: sql`count(DISTINCT ${clicks.id})`,
    uniqueClicks: sql`count(DISTINCT case when ${clicks.isUnique} then ${clicks.id} end)`,
    conversions: sql`count(DISTINCT ${conversions.id})`,
    approvedConversions: sql`count(DISTINCT case when ${conversions.status} = 'approved' then ${conversions.id} end)`,
    revenue: sql`coalesce(sum(${conversions.revenue}), 0)`,
    payout: sql`coalesce(sum(${conversions.payout}), 0)`,
    profit: sql`coalesce(sum(${conversions.revenue}), 0) - coalesce(sum(${conversions.payout}), 0)`,
  }

  const sortExpr = sortBy && sortDir && sortColumnMap[sortBy]
    ? (sortDir === "asc" ? asc(sortColumnMap[sortBy]!) : desc(sortColumnMap[sortBy]!))
    : desc(sql<number>`count(DISTINCT ${clicks.id})`)

  const results = await query
    .where(searchConditions)
    .groupBy(idCol, nameCol, ...breakdownGroupByExt)
    .orderBy(sortExpr)
    .limit(perPage)
    .offset((page - 1) * perPage)

  let mapped = results.map((row) => buildPerformanceResult(row, breakdownBy))

  if (isAdAccountGroup) {
    mapped = await fetchAdAccountSpend(
      db,
      mapped,
      spendStart ?? new Date(0),
      spendEnd ?? new Date(),
    )
  }

  return { mapped, idCol, nameCol, joinTable, joinCond, commonConditions: conditions }
}

// ─── Performance count query ───────────────────────────────────────────────

export async function runPerformanceCountQuery(
  db: Database,
  conditions: SQL | undefined,
  groupBy: string,
  search?: string,
  breakdownBy?: string[],
  opts?: { useAdvertiserTable?: boolean },
): Promise<number> {
  const { idCol, nameCol, joinTable, joinCond } = getGroupByColumns(groupBy, opts)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakdownGroupByExt: any[] = []
  const breakdownJoinTables: Array<{ table: TableLike; cond: SQL | undefined }> = []

  if (breakdownBy && breakdownBy.length > 0) {
    const appliedJoins = new Set<string>()
    for (const field of breakdownBy) {
      const bd = BREAKDOWN_FIELDS[field]
      if (!bd) continue
      breakdownGroupByExt.push(bd.nameExpr)
      if (bd.joinTable && bd.joinCond) {
        breakdownGroupByExt.push(bd.idExpr)
        if (!appliedJoins.has(field)) {
          appliedJoins.add(field)
          breakdownJoinTables.push({ table: bd.joinTable, cond: bd.joinCond })
        }
      } else {
        breakdownGroupByExt.push(bd.idExpr)
      }
    }
  }

  const query = db
    .select({ id: idCol })
    .from(clicks)
    .leftJoin(conversions, eq(clicks.id, conversions.clickId))
    .innerJoin(products, eq(clicks.productId, products.id))

  if (joinTable && joinCond) query.leftJoin(joinTable, joinCond)
  for (const j of breakdownJoinTables) query.leftJoin(j.table, j.cond)

  const searchConditions = search ? and(conditions, ilike(nameCol, `%${search}%`)) : conditions

  const results = await query
    .where(searchConditions)
    .groupBy(idCol, nameCol, ...breakdownGroupByExt)

  return results.length
}
