"use client"

import { useQuery } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc/client"
import type { ClickLogsValues } from "./validations"
import type { ExtendedColumnFilter } from "@adscrush/shared/types/data-table"

// Type aliases matching the server's Zod enum definitions for performance queries
// These ensure we don't rely on `as any` when passing params to tRPC.
type PortalGroupBy =
  | "product" | "product_lp" | "product_lp_browser"
  | "mediaBuyer" | "media_buyer" | "affiliate" | "advertiser" | "source"
  | "adAccount" | "country" | "deviceType" | "os" | "browser" | "ip"
  | "date" | "daily" | "landing_page" | "campaign" | "funnel" | "creative"

type PortalSortBy =
  | "name" | "clicks" | "uniqueClicks" | "conversions" | "approvedConversions"
  | "revenue" | "payout" | "profit" | "cr" | "rpc" | "epc" | "spend" | "roas"

type PortalTopField =
  | "ip" | "device" | "browser" | "os" | "landingPage" | "country"
  | "source" | "sourcePlatform" | "osVersion" | "browserVersion"
  | "deviceVendor" | "deviceModel" | "geoState" | "geoCity" | "referer"
  | "utmSource" | "utmMedium" | "utmCampaign" | "utmTerm" | "utmContent"
  | "creativeName"

type PortalBreakdownBy =
  | "campaign" | "funnel" | "landingPage" | "country" | "geoState" | "geoCity"
  | "browser" | "device" | "os" | "source" | "creative" | "tid"
  | "mediaBuyer" | "adAccount"

export function usePortalReportOverview(params: {
  period: "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "all_time" | "custom"
  dateFrom?: string
  dateTo?: string
}) {
  return trpc.portal.reportOverview.useQuery({
    period: params.period,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })
}

export function usePortalReportTrend(params: {
  period: "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "all_time" | "custom"
  dateFrom?: string
  dateTo?: string
}) {
  return trpc.portal.reportTrend.useQuery({
    period: params.period,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })
}

export function usePortalLogsReport(params: {
  period: "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "all_time" | "custom"
  dateFrom?: string
  dateTo?: string
  productId?: string
  groupBy: PortalGroupBy
  sortBy?: PortalSortBy
  sortDir?: "asc" | "desc"
  page?: number
  perPage?: number
  topFields?: PortalTopField[]
  breakdownBy?: PortalBreakdownBy[]
  filters?: ExtendedColumnFilter<unknown>[]
  joinOperator?: "and" | "or"
}) {
  return trpc.portal.reportPerformance.useQuery({
    period: params.period,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    productId: params.productId,
    groupBy: params.groupBy,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    page: params.page && params.page > 0 ? params.page : 1,
    perPage: params.perPage ?? 50,
    topFields: params.topFields && params.topFields.length > 0 ? params.topFields : undefined,
    breakdownBy: params.breakdownBy && params.breakdownBy.length > 0 ? params.breakdownBy : undefined,
    filters: params.filters,
    joinOperator: params.joinOperator,
  })
}

export function usePortalPerformanceCount(params: {
  period: "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "all_time" | "custom"
  dateFrom?: string
  dateTo?: string
  productId?: string
  groupBy: PortalGroupBy
  search?: string
  breakdownBy?: PortalBreakdownBy[]
  filters?: ExtendedColumnFilter<unknown>[]
  joinOperator?: "and" | "or"
}) {
  return trpc.portal.reportPerformanceCount.useQuery({
    period: params.period,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    productId: params.productId,
    groupBy: params.groupBy,
    search: params.search,
    breakdownBy: params.breakdownBy && params.breakdownBy.length > 0 ? params.breakdownBy : undefined,
    filters: params.filters,
    joinOperator: params.joinOperator,
  })
}

export function usePortalClickLogs(params: ClickLogsValues) {
  const utils = trpc.useUtils()
  return useQuery({
    queryKey: ["portal", "clickLogs", params] as const,
    queryFn: async () => {
      const data = await utils.portal.reportClickLog.fetch({
        filters: params.filters ?? [],
        joinOperator: params.joinOperator,
        page: params.page,
        perPage: params.perPage,
      })
      return { data: data.items, pageCount: data.pageCount, total: data.total }
    },
    staleTime: 60_000,
  })
}
