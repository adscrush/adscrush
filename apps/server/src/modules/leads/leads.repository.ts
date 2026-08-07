import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "@adscrush/db/drizzle"
import type { Database } from "@adscrush/db"
import {
  advertisers,
  campaigns,
  leads,
  mediaBuyers,
  products,
} from "@adscrush/db/schema"
import { filterColumns } from "@adscrush/db/lib/filter-columns"
import type { ExtendedColumnFilter } from "@adscrush/shared/types/data-table"
import type { LeadScope, ListLeadsInput } from "./leads.types"
import type { LeadStatusUpdatePayload } from "@adscrush/shared/lib/lead-status"

// ─── Scope Condition Builder ────────────────────────────────────────────────

/**
 * Builds scope conditions for both advertiser and media buyer scoping.
 * Used in list and export queries.
 */
export function buildScopeConditions(scope: LeadScope) {
  return and(
    !scope.isAllAdvertisers
      ? inArray(leads.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
      : undefined,
    !scope.isAllMediaBuyers
      ? inArray(leads.mediaBuyerId, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
      : undefined
  )
}

// ─── Table with Joined Columns ──────────────────────────────────────────────

const tableWithJoinedColumns = {
  ...leads,
  productName: products.name,
  campaignName: campaigns.name,
  mediaBuyerName: mediaBuyers.name,
  advertiserName: advertisers.name,
}

// ─── List Query ─────────────────────────────────────────────────────────────

/**
 * Allowed sort columns to prevent SQL injection
 */
const allowedSortColumns = {
  createdAt: leads.createdAt,
  payout: leads.payout,
  status: leads.status,
} as const

/**
 * Select shape for lead queries (used in list and byId)
 */
const leadSelectShape = {
  id: leads.id,
  tid: leads.tid,
  name: leads.name,
  phone: leads.phone,
  email: leads.email,
  address: leads.address,
  pincode: leads.pincode,
  city: leads.city,
  state: leads.state,
  sub1: leads.sub1,
  sub2: leads.sub2,
  sub3: leads.sub3,
  sub4: leads.sub4,
  sub5: leads.sub5,
  payout: leads.payout,
  status: leads.status,
  currency: leads.currency,
  campaignId: leads.campaignId,
  geoCountry: leads.geoCountry,
  ipEncrypted: leads.ipEncrypted,
  method: leads.method,
  createdAt: leads.createdAt,
  product: {
    id: products.id,
    name: products.name,
  },
  campaign: {
    id: campaigns.id,
    name: campaigns.name,
  },
  mediaBuyer: {
    id: mediaBuyers.id,
    name: mediaBuyers.name,
  },
  advertiser: {
    id: advertisers.id,
    name: advertisers.name,
  },
}

/**
 * Builds filter conditions from input parameters
 */
export function buildFilterConditions(
  input: ListLeadsInput,
  scopeConditions: ReturnType<typeof and>
) {
  return and(
    input.search
      ? or(
          ilike(leads.id, `%${input.search}%`),
          ilike(leads.tid, `%${input.search}%`),
          ilike(leads.name, `%${input.search}%`),
          ilike(leads.phone, `%${input.search}%`),
          ilike(leads.email, `%${input.search}%`),
          ilike(leads.address, `%${input.search}%`),
          ilike(leads.city, `%${input.search}%`),
          ilike(leads.pincode, `%${input.search}%`),
          ilike(leads.state, `%${input.search}%`),
          ilike(products.name, `%${input.search}%`),
          ilike(campaigns.name, `%${input.search}%`),
          ilike(mediaBuyers.name, `%${input.search}%`),
          ilike(advertisers.name, `%${input.search}%`)
        )
      : undefined,
    input.status && input.status.length > 0
      ? inArray(leads.status, input.status as ("pending" | "approved" | "rejected")[])
      : undefined,
    input.productId ? eq(leads.productId, input.productId) : undefined,
    input.mediaBuyerId ? eq(leads.mediaBuyerId, input.mediaBuyerId) : undefined,
    input.advertiserId ? eq(leads.advertiserId, input.advertiserId) : undefined,
    input.campaignId ? eq(leads.campaignId, input.campaignId) : undefined,
    input.dateFrom ? gte(leads.createdAt, new Date(input.dateFrom)) : undefined,
    input.dateTo ? lte(leads.createdAt, new Date(input.dateTo)) : undefined,
    scopeConditions
  )
}

/**
 * Builds the final WHERE clause, supporting advanced filters
 */
export function buildFinalWhere(
  input: ListLeadsInput,
  scopeConditions: ReturnType<typeof and>,
  basicConditions: ReturnType<typeof and>
) {
  const advancedWhere =
    input.filters && input.filters.length > 0
      ? filterColumns({
          table: tableWithJoinedColumns,
          filters: input.filters as ExtendedColumnFilter<unknown>[],
          joinOperator: input.joinOperator,
          database: "postgres",
        })
      : undefined

  return and(
    scopeConditions,
    input.filters && input.filters.length > 0 ? advancedWhere : basicConditions
  )
}

/**
 * Paginated list of leads with counts
 */
export async function findLeadsPaginated(
  db: Database,
  input: ListLeadsInput,
  finalWhere: ReturnType<typeof and>
) {
  const offset = (input.page - 1) * input.perPage

  // Sort column validation
  type SortKey = keyof typeof allowedSortColumns
  const sortKey = (input.sort && input.sort in allowedSortColumns ? input.sort : null) as SortKey | null
  const sortColumn = sortKey ? allowedSortColumns[sortKey] : leads.createdAt
  const orderBy = input.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn)

  const [items, countResult] = await Promise.all([
    db
      .select(leadSelectShape)
      .from(leads)
      .innerJoin(products, eq(leads.productId, products.id))
      .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
      .leftJoin(mediaBuyers, eq(leads.mediaBuyerId, mediaBuyers.id))
      .leftJoin(advertisers, eq(leads.advertiserId, advertisers.id))
      .where(finalWhere)
      .orderBy(orderBy)
      .limit(input.perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .innerJoin(products, eq(leads.productId, products.id))
      .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
      .leftJoin(mediaBuyers, eq(leads.mediaBuyerId, mediaBuyers.id))
      .leftJoin(advertisers, eq(leads.advertiserId, advertisers.id))
      .where(finalWhere),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return { items, total, pageCount: Math.ceil(total / input.perPage) }
}

// ─── By ID Query ────────────────────────────────────────────────────────────

/**
 * Find a single lead by ID
 */
export async function findLeadById(
  db: Database,
  id: string,
  scopeConditions: ReturnType<typeof and>
) {
  const [result] = await db
    .select(leadSelectShape)
    .from(leads)
    .innerJoin(products, eq(leads.productId, products.id))
    .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .leftJoin(mediaBuyers, eq(leads.mediaBuyerId, mediaBuyers.id))
    .leftJoin(advertisers, eq(leads.advertiserId, advertisers.id))
    .where(and(eq(leads.id, id), scopeConditions))
    .limit(1)

  return result ?? null
}

// ─── Status Update ──────────────────────────────────────────────────────────

/**
 * Find lead for status update (minimal columns)
 */
export async function findLeadForStatusUpdate(db: Database, id: string) {
  const [lead] = await db
    .select({
      id: leads.id,
      status: leads.status,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1)

  return lead ?? null
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  db: Database,
  id: string,
  updatePayload: LeadStatusUpdatePayload
) {
  const [updated] = await db
    .update(leads)
    .set(updatePayload)
    .where(eq(leads.id, id))
    .returning({ id: leads.id, status: leads.status })

  return updated ?? null
}

// ─── Export Query ───────────────────────────────────────────────────────────

/**
 * Select shape for export (includes flattened names)
 */
const leadExportSelectShape = {
  id: leads.id,
  tid: leads.tid,
  name: leads.name,
  phone: leads.phone,
  email: leads.email,
  address: leads.address,
  pincode: leads.pincode,
  city: leads.city,
  state: leads.state,
  status: leads.status,
  payout: leads.payout,
  currency: leads.currency,
  productName: products.name,
  campaignName: campaigns.name,
  mediaBuyerName: mediaBuyers.name,
  advertiserName: advertisers.name,
  geoCountry: leads.geoCountry,
  ipAddress: leads.ipEncrypted,
  sub1: leads.sub1,
  sub2: leads.sub2,
  sub3: leads.sub3,
  sub4: leads.sub4,
  sub5: leads.sub5,
  createdAt: leads.createdAt,
}

/**
 * Fetch all leads for export (up to 100k rows)
 */
export async function findLeadsForExport(
  db: Database,
  finalWhere: ReturnType<typeof and>
) {
  return db
    .select(leadExportSelectShape)
    .from(leads)
    .innerJoin(products, eq(leads.productId, products.id))
    .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .leftJoin(mediaBuyers, eq(leads.mediaBuyerId, mediaBuyers.id))
    .leftJoin(advertisers, eq(leads.advertiserId, advertisers.id))
    .where(finalWhere)
    .limit(100000)
    .orderBy(desc(leads.createdAt))
}
