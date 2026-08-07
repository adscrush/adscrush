import { queryOptions } from "@tanstack/react-query"
import type { ClickLogsValues, ConversionLogsValues } from "./validations"

export const reportQueries = {
  all: ["reports"] as const,
  performance: (params: unknown) => [...reportQueries.all, "performance", params] as const,
  overview: (params: unknown) => [...reportQueries.all, "overview", params] as const,
  conversions: (params: unknown) => [...reportQueries.all, "conversions", params] as const,
  trend: (params: unknown) => [...reportQueries.all, "trend", params] as const,
  logs: (params: unknown) => [...reportQueries.all, "logs", params] as const,
}

export const conversionLogKeys = {
  all: ["conversionLogs"] as const,
  list: (params: ConversionLogsValues) => [...conversionLogKeys.all, "list", params] as const,
}

export const clickLogKeys = {
  all: ["clickLogs"] as const,
  list: (params: ClickLogsValues) => [...clickLogKeys.all, "list", params] as const,
}

export function getConversionLogsQueryOptions<T>(
  params: ConversionLogsValues,
  fetcher: (params: ConversionLogsValues) => Promise<T>,
) {
  return queryOptions({
    queryKey: conversionLogKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60_000,
  })
}

export function getClickLogsQueryOptions<T>(
  params: ClickLogsValues,
  fetcher: (params: ClickLogsValues) => Promise<T>,
) {
  return queryOptions({
    queryKey: clickLogKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60_000,
  })
}
