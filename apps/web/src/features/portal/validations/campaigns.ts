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
import { CAMPAIGN_STATUS_VALUES } from "@adscrush/shared/constants/status"
import type { Campaign as CampaignDb } from "@adscrush/db/schema"

export const portalCampaignSearchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value),
  ).withDefault("commandFilters"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  sort: getSortingStateParser<CampaignDb>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(CAMPAIGN_STATUS_VALUES)).withDefault(
    [],
  ),

  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type GetPortalCampaignsSchema = Awaited<
  ReturnType<typeof portalCampaignSearchParamsCache.parse>
>
