import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/parsers"
import { flagConfig } from "@/config/flag"
import { createSearchParamsCache, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server"
import { type users } from "@adscrush/db/schema"

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(flagConfig.featureFlags.map((flag) => flag.value)).withDefault("commandFilters"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  sort: getSortingStateParser<typeof users.$inferSelect>().withDefault([{ id: "createdAt", desc: true }]),
  name: parseAsString.withDefault(""),

  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type GetUsersSchema = Awaited<ReturnType<typeof searchParamsCache.parse>>
