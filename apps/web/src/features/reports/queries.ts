import { useQuery } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc/client"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"
import type { ClickLogsValues } from "./validations"

type RouterOutputs = inferRouterOutputs<AppRouter>
export type PerformanceRow = RouterOutputs["reports"]["performance"][number]
export type ReportOverview = RouterOutputs["reports"]["overview"]
export type ConversionLogRow = RouterOutputs["reports"]["conversionLog"]["items"][number]
export type ClickLogRow = RouterOutputs["reports"]["clickLog"]["items"][number]
export type TrendRow = RouterOutputs["reports"]["trend"][number]

/** A single grouped performance row, keyed by the metric field names the
 *  server actually returns. */
export type LogsReportRow = PerformanceRow & {
  [key: string]: string | number | boolean | null | undefined
}

/** Date-range period options shared by all report queries. */
export type ReportPeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "all_time"
  | "custom"

/** Dimensions the General Report can group rows by. */
export type ReportGroupBy =
  | "campaign"
  | "funnel"
  | "product"
  | "media_buyer"
  | "adAccount"
  | "advertiser"
  | "landing_page"
  | "country"
  | "source"
  | "creative"
  | "deviceType"
  | "os"
  | "browser"
  | "ip"
  | "daily"

/** Metric columns eligible for sorting on the server. */
export type ReportSortBy =
  | "name"
  | "clicks"
  | "uniqueClicks"
  | "conversions"
  | "approvedConversions"
  | "revenue"
  | "payout"
  | "profit"
  | "cr"
  | "rpc"
  | "epc"

/** Per-group "top value" dimension columns the server can resolve. */
export type ReportTopField = "ip" | "device" | "browser" | "os" | "landingPage"

export function useLogsReport(params: {
  period: "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "all_time" | "custom"
  dateFrom?: string
  dateTo?: string
  productId?: string
  mediaBuyerId?: string
  advertiserId?: string
  groupBy: ReportGroupBy
  sortBy?: ReportSortBy
  sortDir?: "asc" | "desc"
  page?: number
  limit?: number
  topFields?: ReportTopField[]
}) {
  return trpc.reports.performance.useQuery({
    period: params.period,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    productId: params.productId,
    mediaBuyerId: params.mediaBuyerId,
    advertiserId: params.advertiserId,
    groupBy: params.groupBy,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    page: params.page && params.page > 0 ? params.page : 1,
    perPage: params.limit ?? 50,
    topFields: params.topFields && params.topFields.length > 0 ? params.topFields : undefined,
  })
}

export function useReportTrend(params: {
  period: "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "all_time" | "custom"
  dateFrom?: string
  dateTo?: string
  productId?: string
  mediaBuyerId?: string
  advertiserId?: string
}) {
  return trpc.reports.trend.useQuery(params)
}

export function useReportOverview(params: {
  period: "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "all_time" | "custom"
  dateFrom?: string
  dateTo?: string
  productId?: string
  mediaBuyerId?: string
  advertiserId?: string
}) {
  return trpc.reports.overview.useQuery(params)
}

import type { ConversionLogsValues } from "./validations"
import { getConversionLogsQueryOptions, getClickLogsQueryOptions } from "./query-options"

export { reportQueries, conversionLogKeys, clickLogKeys, getConversionLogsQueryOptions, getClickLogsQueryOptions } from "./query-options"

export function useConversionLogs(params: ConversionLogsValues) {
  const utils = trpc.useUtils()
  return useQuery(
    getConversionLogsQueryOptions(params, async (p) => {
      const data = await utils.reports.conversionLog.fetch({
        filters: p.filters ?? [],
        joinOperator: p.joinOperator,
        page: p.page,
        perPage: p.perPage,
      })
      return { data: data.items, pageCount: data.pageCount, total: data.total }
    })
  )
}

export function useClickLogs(params: ClickLogsValues) {
  const utils = trpc.useUtils()
  return useQuery(
    getClickLogsQueryOptions(params, async (p) => {
      const data = await utils.reports.clickLog.fetch({
        filters: p.filters ?? [],
        joinOperator: p.joinOperator,
        page: p.page,
        perPage: p.perPage,
      })
      return { data: data.items, pageCount: data.pageCount, total: data.total }
    })
  )
}
