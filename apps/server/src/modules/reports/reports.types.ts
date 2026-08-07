import { z } from "zod"
import { filterItemSchema } from "@adscrush/shared/lib/parsers"

const filtersArraySchema = z.array(filterItemSchema).default([])

export const reportPeriodSchema = z.enum(["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "all_time", "custom"]).default("this_month")

export const clickLogInputSchema = z.object({
  filters: z.array(filterItemSchema).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(50),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  landingPageId: z.string().optional(),
  funnelId: z.string().optional(),
  campaignId: z.string().optional(),
  productId: z.string().optional(),
  sort: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
})

export const clickLogOptionsInputSchema = z.object({
  column: z.string(),
  q: z.string().optional(),
  ids: z.array(z.string()).optional(),
})

export const conversionLogInputSchema = z.object({
  filters: z.array(filterItemSchema).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(50),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  campaignId: z.string().optional(),
  productId: z.string().optional(),
})

export const conversionLogOptionsInputSchema = z.object({
  column: z.string(),
  q: z.string().optional(),
  ids: z.array(z.string()).optional(),
})

export const reportExportInputSchema = z.object({
  type: z.enum(["performance", "clickLog", "conversionLog"]),
  period: reportPeriodSchema,
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  mediaBuyerId: z.string().optional(),
  advertiserId: z.string().optional(),
  source: z.string().optional(),
  groupBy: z.string().optional(),
})

export const reportBaseQuerySchema = z.object({
  period: reportPeriodSchema,
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  productId: z.string().optional(),
  mediaBuyerId: z.string().optional(),
  advertiserId: z.string().optional(),
})

export const reportPerformanceQuerySchema = reportBaseQuerySchema.extend({
  groupBy: z.enum(["product", "product_lp", "product_lp_browser", "mediaBuyer", "media_buyer", "affiliate", "advertiser", "source", "adAccount", "country", "deviceType", "os", "browser", "ip", "date", "daily", "landing_page", "campaign", "funnel", "creative"]).default("product"),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(50),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["name", "clicks", "uniqueClicks", "conversions", "approvedConversions", "revenue", "payout", "profit", "cr", "rpc", "epc", "spend", "roas"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  topFields: z.array(z.enum(["ip", "device", "browser", "os", "landingPage", "country", "source", "sourcePlatform", "osVersion", "browserVersion", "deviceVendor", "deviceModel", "geoState", "geoCity", "referer", "utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent", "creativeName"])).max(25).optional(),
  breakdownBy: z.array(z.enum(["campaign", "funnel", "landingPage", "country", "geoState", "geoCity", "browser", "device", "os", "source", "creative", "tid", "mediaBuyer", "adAccount"])).max(14).optional(),
  filters: filtersArraySchema,
  joinOperator: z.enum(["and", "or"]).default("and"),
})

export const reportPerformanceCountQuerySchema = reportBaseQuerySchema.extend({
  groupBy: z.enum(["product", "product_lp", "product_lp_browser", "mediaBuyer", "media_buyer", "affiliate", "advertiser", "source", "adAccount", "country", "deviceType", "os", "browser", "ip", "date", "daily", "landing_page", "campaign", "funnel", "creative"]).default("product"),
  search: z.string().max(200).optional(),
  breakdownBy: z.array(z.enum(["campaign", "funnel", "landingPage", "country", "geoState", "geoCity", "browser", "device", "os", "source", "creative", "tid", "mediaBuyer", "adAccount"])).max(14).optional(),
  filters: filtersArraySchema,
  joinOperator: z.enum(["and", "or"]).default("and"),
})

export const reportLogsQuerySchema = reportBaseQuerySchema.extend({
  display_fields: z.array(z.string()).default(["product_id", "media_buyer", "gross_clicks", "conversions", "revenue", "payout", "status", "cr"]),
  orderBy: z.string().optional().default("conversions"),
  orderDir: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().default(100),
})
