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
import { type Advertiser, advertisers } from "@adscrush/db/schema"

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value)
  ).withDefault("commandFilters"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  sort: getSortingStateParser<Advertiser>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  name: parseAsString.withDefault(""),
  status: parseAsArrayOf(
    parseAsStringEnum(advertisers.status.enumValues)
  ).withDefault([]),

  createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type GetAdvertisersSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>
