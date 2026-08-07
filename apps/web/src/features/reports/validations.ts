import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { getFiltersStateParser } from "@adscrush/shared/lib/parsers"
import type { ExtendedColumnFilter } from "@adscrush/shared/types/data-table"

export const performanceSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50),
  period: parseAsStringEnum(["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "all_time", "custom"]).withDefault("today"),
  dateFrom: parseAsString, // Using string for YYYY-MM-DD
  dateTo: parseAsString,
  productId: parseAsString,
  advertiserId: parseAsString,
  mediaBuyerId: parseAsString,
  managerId: parseAsString,
  event: parseAsString,
  currency: parseAsString,
  timezone: parseAsString.withDefault("GMT+5:30"),
  subOffer: parseAsString,
  logType: parseAsString.withDefault("all"),
  hour: parseAsString,
  status: parseAsString,
  groupBy: parseAsStringEnum(["campaign", "funnel", "product", "media_buyer", "adAccount", "advertiser", "landing_page", "country", "source", "creative", "deviceType", "os", "browser", "ip", "daily"]).withDefault("campaign"),
  displayFields: parseAsString.withDefault("name,clicks,uniqueClicks,conversions,cr,revenue,payout,profit,ip,device,browser,os,landingPage"),
  orderBy: parseAsString.withDefault("clicks"),
  orderDir: parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  q: parseAsString, // search query
}

export const searchParamsCache = createSearchParamsCache(performanceSearchParams)
export type PerformanceSearchParams = typeof performanceSearchParams

export const conversionLogsSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50),
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export type ConversionLogsSearchParams = typeof conversionLogsSearchParams

export type ConversionLogsValues = {
  page: number
  perPage: number
  filters: ExtendedColumnFilter<unknown>[]
  joinOperator: "and" | "or"
}

export const clickLogsSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50),
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const clickLogsSearchParamsCache = createSearchParamsCache(clickLogsSearchParams)
export type ClickLogsSearchParams = typeof clickLogsSearchParams

// Extracted values type from the schema (for use in components)
export type ClickLogsValues = {
  page: number
  perPage: number
  filters: ExtendedColumnFilter<unknown>[]
  joinOperator: "and" | "or"
}
