import { flagConfig } from "@/config/flag"
import { type Category } from "@adscrush/db/schema"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/parsers"
import { createSearchParamsCache, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server"

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(flagConfig.featureFlags.map((flag) => flag.value)).withDefault("commandFilters"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  sort: getSortingStateParser<Category>().withDefault([{ id: "createdAt", desc: true }]),
  search: parseAsString.withDefault(""),

  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type GetCategoriesSchema = Awaited<ReturnType<typeof searchParamsCache.parse>>
