import { flagConfig } from "@/config/flag"
import { type Employee, employees } from "@adscrush/db/schema"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/parsers"
import { createSearchParamsCache, parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server"

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(flagConfig.featureFlags.map((flag) => flag.value)).withDefault("commandFilters"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  sort: getSortingStateParser<Employee>().withDefault([{ id: "createdAt", desc: true }]),
  name: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(employees.status.enumValues)).withDefault([]),

  createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type GetEmployeesSchema = Awaited<ReturnType<typeof searchParamsCache.parse>>
