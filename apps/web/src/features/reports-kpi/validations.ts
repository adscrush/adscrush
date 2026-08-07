import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { getFiltersStateParser } from "@adscrush/shared/lib/parsers"

export const kpiSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50),
  period: parseAsStringEnum([
    "today",
    "yesterday",
    "this_week",
    "last_week",
    "this_month",
    "last_month",
    "all_time",
    "custom",
  ]).withDefault("this_month"),
  dateFrom: parseAsString,
  dateTo: parseAsString,
  tab: parseAsStringEnum([
    "campaign",
    "product",
    "advertiser",
    "mediaBuyer",
    "adAccount",
  ]).withDefault("campaign"),
  sortBy: parseAsString.withDefault("name"),
  sortDir: parseAsStringEnum(["asc", "desc"]).withDefault("asc"),
  search: parseAsString,
  /** Comma-separated list of active breakdown dimension IDs. */
  breakdownBy: parseAsString.withDefault(""),
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const kpiSearchParamsCache = createSearchParamsCache(kpiSearchParams)
export type KpiSearchParams = typeof kpiSearchParams
