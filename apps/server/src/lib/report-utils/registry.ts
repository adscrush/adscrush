import { eq, sql, type SQL } from "@adscrush/db/drizzle"
import type { Database } from "@adscrush/db"
import {
  advertisers,
  mediaBuyers,
  clicks,
  products,
  adAccounts,
  campaigns,
  funnels,
  landingPages,
} from "@adscrush/db/schema"

// ── Type aliases ───────────────────────────────────────────────────────────┐
/**
 * Drizzle column reference used in SELECT/GROUP BY.
 * Uses `any` because Drizzle's PgColumn types are generic-parameterized and
 * structurally incompatible with each other and with the core Column type,
 * making strict typing impractical for dynamic query building.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DrizzleColumn = any

/** A Drizzle table-like object that can be used in leftJoin. Same reasoning as DrizzleColumn. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableLike = any

// ── Breakdown dimension fields ─────────────────────────────────────────────┘
export interface BreakdownField {
  idExpr: DrizzleColumn
  nameExpr: DrizzleColumn
  joinTable?: TableLike
  joinCond?: SQL | undefined
}

export const BREAKDOWN_FIELDS: Record<string, BreakdownField> = {
  campaign: { idExpr: campaigns.id, nameExpr: campaigns.name, joinTable: campaigns, joinCond: eq(clicks.campaignId, campaigns.id) },
  funnel: { idExpr: funnels.id, nameExpr: funnels.name, joinTable: funnels, joinCond: eq(clicks.funnelId, funnels.id) },
  landingPage: { idExpr: landingPages.id, nameExpr: landingPages.name, joinTable: landingPages, joinCond: eq(clicks.landingPageId, landingPages.id) },
  country: { idExpr: clicks.geoCountry, nameExpr: clicks.geoCountry },
  geoState: { idExpr: clicks.geoState, nameExpr: clicks.geoState },
  geoCity: { idExpr: clicks.geoCity, nameExpr: clicks.geoCity },
  browser: { idExpr: clicks.browser, nameExpr: clicks.browser },
  device: { idExpr: clicks.deviceType, nameExpr: clicks.deviceType },
  os: { idExpr: clicks.os, nameExpr: clicks.os },
  source: { idExpr: clicks.source, nameExpr: clicks.source },
  creative: { idExpr: clicks.creativeId, nameExpr: clicks.creativeName },
  tid: { idExpr: clicks.tid, nameExpr: clicks.tid },
  mediaBuyer: { idExpr: clicks.mediaBuyerId, nameExpr: mediaBuyers.name, joinTable: mediaBuyers, joinCond: eq(clicks.mediaBuyerId, mediaBuyers.id) },
  adAccount: { idExpr: clicks.adAccountId, nameExpr: adAccounts.name, joinTable: adAccounts, joinCond: eq(clicks.adAccountId, adAccounts.id) },
}

// ── Top field helpers ──────────────────────────────────────────────────────┘
export type TopField =
  | "ip" | "device" | "browser" | "os" | "landingPage"
  | "country" | "source" | "sourcePlatform" | "osVersion"
  | "browserVersion" | "deviceVendor" | "deviceModel"
  | "geoState" | "geoCity" | "referer"
  | "utmSource" | "utmMedium" | "utmCampaign" | "utmTerm" | "utmContent"
  | "creativeName"

export const TOP_FIELD_SELF_GROUP: Record<TopField, string> = {
  ip: "ip",
  device: "deviceType",
  browser: "browser",
  os: "os",
  landingPage: "landing_page",
  country: "country",
  source: "source",
  sourcePlatform: "__never__",
  osVersion: "__never__",
  browserVersion: "__never__",
  deviceVendor: "__never__",
  deviceModel: "__never__",
  geoState: "__never__",
  geoCity: "__never__",
  referer: "__never__",
  utmSource: "__never__",
  utmMedium: "__never__",
  utmCampaign: "__never__",
  utmTerm: "__never__",
  utmContent: "__never__",
  creativeName: "creative",
}

/** Map of top field names to Drizzle column references. Values are Drizzle columns which are type-complex. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOP_FIELD_COL_MAP: Record<string, any> = {
  device: clicks.deviceType,
  browser: clicks.browser,
  country: clicks.geoCountry,
  os: clicks.os,
  source: clicks.source,
  sourcePlatform: clicks.sourcePlatform,
  osVersion: clicks.osVersion,
  browserVersion: clicks.browserVersion,
  deviceVendor: clicks.deviceVendor,
  deviceModel: clicks.deviceModel,
  geoState: clicks.geoState,
  geoCity: clicks.geoCity,
  referer: clicks.referer,
  utmSource: clicks.utmSource,
  utmMedium: clicks.utmMedium,
  utmCampaign: clicks.utmCampaign,
  utmTerm: clicks.utmTerm,
  utmContent: clicks.utmContent,
  creativeName: clicks.creativeName,
}

export const NULL_GROUP_KEY = "__null__"

export const rowGroupKey = (id: string | null): string => id ?? NULL_GROUP_KEY

// ── GroupBy column resolution ──────────────────────────────────────────────┘
export interface GroupByColumns {
  idCol: DrizzleColumn
  nameCol: DrizzleColumn
  joinTable?: TableLike
  joinCond?: SQL | undefined
  isAdAccountGroup?: boolean
}

export function getGroupByColumns(
  groupBy: string,
  opts?: { useAdvertiserTable?: boolean },
): GroupByColumns {
  const result: GroupByColumns = { idCol: products.id, nameCol: products.name }
  switch (groupBy) {
    case "campaign": result.idCol = campaigns.id; result.nameCol = campaigns.name; result.joinTable = campaigns; result.joinCond = eq(clicks.campaignId, campaigns.id); break
    case "funnel": result.idCol = funnels.id; result.nameCol = funnels.name; result.joinTable = funnels; result.joinCond = eq(clicks.funnelId, funnels.id); break
    case "product": break
    case "product_lp": result.idCol = sql<string>`${products.id} || '::' || COALESCE(${clicks.landingPageId}, '__null__')`; result.nameCol = sql<string>`${products.name} || ' / ' || COALESCE(${landingPages.name}, 'No LP')`; result.joinTable = landingPages; result.joinCond = eq(clicks.landingPageId, landingPages.id); break
    case "product_lp_browser": result.idCol = sql<string>`${products.id} || '::' || COALESCE(${clicks.landingPageId}, '__null__') || '::' || COALESCE(${clicks.browser}, 'unknown')`; result.nameCol = sql<string>`${products.name} || ' / ' || COALESCE(${landingPages.name}, 'No LP') || ' / ' || COALESCE(${clicks.browser}, 'Unknown Browser')`; result.joinTable = landingPages; result.joinCond = eq(clicks.landingPageId, landingPages.id); break
    case "mediaBuyer": case "media_buyer": case "affiliate": result.idCol = mediaBuyers.id; result.nameCol = mediaBuyers.name; result.joinTable = mediaBuyers; result.joinCond = eq(clicks.mediaBuyerId, mediaBuyers.id); break
    case "advertiser":
      if (opts?.useAdvertiserTable) {
        result.idCol = advertisers.id; result.nameCol = advertisers.name; result.joinTable = advertisers; result.joinCond = eq(products.advertiserId, advertisers.id)
      } else {
        result.idCol = sql<string>`COALESCE(${products.advertiserId}, '__unknown__')`; result.nameCol = sql<string>`COALESCE(${products.advertiserId}, 'Unknown')`
      }
      break
    case "source": result.idCol = clicks.source; result.nameCol = clicks.source; break
    case "adAccount": result.idCol = adAccounts.id; result.nameCol = adAccounts.name; result.joinTable = adAccounts; result.joinCond = eq(clicks.adAccountId, adAccounts.id); result.isAdAccountGroup = true; break
    case "creative": result.idCol = clicks.creativeId; result.nameCol = clicks.creativeName; break
    case "landing_page": result.idCol = landingPages.id; result.nameCol = landingPages.name; result.joinTable = landingPages; result.joinCond = eq(clicks.landingPageId, landingPages.id); break
    case "country": result.idCol = clicks.geoCountry; result.nameCol = clicks.geoCountry; break
    case "deviceType": result.idCol = clicks.deviceType; result.nameCol = clicks.deviceType; break
    case "os": result.idCol = clicks.os; result.nameCol = clicks.os; break
    case "browser": result.idCol = clicks.browser; result.nameCol = clicks.browser; break
    case "ip": result.idCol = clicks.ipHash; result.nameCol = clicks.ipHash; break
    case "date": case "daily": result.idCol = sql<string>`date(${clicks.createdAt})::text`; result.nameCol = sql<string>`date(${clicks.createdAt})::text`; break
  }
  return result
}

// ── Performance result row type ────────────────────────────────────────────┘
export type PerformanceResultRow = {
  id: string | null
  name: string
  clicks: number
  uniqueClicks: number
  conversions: number
  approvedConversions: number
  revenue: number
  payout: number
  profit: number
  cr: number
  rpc: number
  epc: number
  spend?: number
  roas?: number
  ip?: string | null
  device?: string | null
  browser?: string | null
  os?: string | null
  landingPage?: string | null
  country?: string | null
  source?: string | null
  sourcePlatform?: string | null
  osVersion?: string | null
  browserVersion?: string | null
  deviceVendor?: string | null
  deviceModel?: string | null
  referer?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmTerm?: string | null
  utmContent?: string | null
  geoState?: string | null
  geoCity?: string | null
  campaignName?: string | null
  funnelName?: string | null
  landingPageName?: string | null
  countryName?: string | null
  geoStateName?: string | null
  geoCityName?: string | null
  browserName?: string | null
  deviceName?: string | null
  osName?: string | null
  sourceName?: string | null
  creativeName?: string | null
  tid?: string | null
  mediaBuyerName?: string | null
  adAccountName?: string | null
}

// ── Performance query types ────────────────────────────────────────────────┘
/** Row shape returned by the dynamic SQL query. */
export interface PerformanceQueryRow {
  id: string | null
  name: string | null
  clicks: unknown
  uniqueClicks: unknown
  conversions: unknown
  approvedConversions: unknown
  revenue: unknown
  payout: unknown
  [key: string]: unknown
}

export interface PerformanceQueryOptions {
  db: Database
  conditions: SQL | undefined
  groupBy: string
  page: number
  perPage: number
  search?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  breakdownBy?: string[]
  useAdvertiserTable?: boolean
  spendStart?: Date
  spendEnd?: Date
}
