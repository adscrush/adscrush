import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@adscrush/shared/lib/parsers"
import { flagConfig } from "@/config/flag"
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { LANDING_PAGE_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { type Funnel } from "@adscrush/db/schema"

export type FunnelListSortableColumns = Omit<
  Funnel,
  "product" | "landingPages"
> & {
  product: string
  landingPages: string
}

export const portalFunnelSearchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value),
  ).withDefault("commandFilters"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),

  sort: getSortingStateParser<FunnelListSortableColumns>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  status: parseAsArrayOf(
    parseAsStringEnum(LANDING_PAGE_STATUS_VALUES),
  ).withDefault([]),
  productId: parseAsString.withDefault(""),
  language: parseAsString.withDefault(""),

  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type GetPortalFunnelsSchema = Awaited<
  ReturnType<typeof portalFunnelSearchParamsCache.parse>
>
