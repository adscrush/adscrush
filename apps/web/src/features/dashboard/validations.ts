import { createSearchParamsCache, parseAsString } from "nuqs/server"

export const dashboardSearchParams = {
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
}

export type DashboardSearchParams = typeof dashboardSearchParams

export const dashboardSearchParamsCache = createSearchParamsCache(dashboardSearchParams)
