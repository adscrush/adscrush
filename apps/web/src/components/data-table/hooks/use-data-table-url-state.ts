"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/parsers"
import type { ExtendedColumnFilter, ExtendedColumnSort } from "@adscrush/shared/types/data-table"

interface UseDataTableUrlStateOptions<TSearch, TDb> {
  /** The search params cache output from the server page (defaults) */
  search: TSearch & {
    page: number
    perPage: number
    joinOperator: "and" | "or"
  }
  /** Sort state parser — pass a preconfigured one or use default */
  sortParser?: ReturnType<typeof getSortingStateParser<TDb>>
}

export function useDataTableUrlState<TSearch, TDb>({
  search,
  sortParser: customSortParser,
}: UseDataTableUrlStateOptions<TSearch, TDb>) {
  const sortParser = customSortParser ?? getSortingStateParser<TDb>()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: sortParser.withDefault([] as ExtendedColumnSort<TDb>[]),
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"] as const).withDefault(search.joinOperator),
  })

  const params: TSearch & {
    page: number
    perPage: number
    sort: ExtendedColumnSort<TDb>[]
    filters: ExtendedColumnFilter<unknown>[]
    joinOperator: "and" | "or"
  } = useMemo(
    () => ({
      ...search,
      page: states.page,
      perPage: states.perPage,
      sort: (states.sort ?? []) as ExtendedColumnSort<TDb>[],
      filters: states.filters ?? [],
      joinOperator: (states.joinOperator ?? "and") as "and" | "or",
    }),
    [search, states],
  )

  return params
}
