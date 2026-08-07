"use client"

import { trpc } from "@/lib/trpc/client"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { MetricHero } from "@/features/dashboard/components/metric-hero"
import { RevenueChart } from "@/features/dashboard/components/revenue-chart"
import { GeographyPanel } from "@/features/dashboard/components/geography-panel"
import { ActiveProductsPanel } from "@/features/dashboard/components/active-products-panel"
import { PeriodSelector } from "@/features/dashboard/components/period-selector"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { TrafficBySourceChart } from "@/features/dashboard/components/traffic-by-source-chart"
import { BrowserRadialChart } from "@/features/dashboard/components/browser-radial-chart"
import { HourlyHeatmap } from "@/features/dashboard/components/hourly-heatmap"
import { ConversionTrend } from "@/features/dashboard/components/conversion-trend"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@adscrush/ui/components/table"
import { Badge } from "@adscrush/ui/components/badge"
import { IconChartBar } from "@tabler/icons-react"
import { Card, CardHeader, CardContent } from "@adscrush/ui/components/card"
import { formatCurrency } from "@/features/dashboard/utils"
import { getTimezoneOffset } from "@/features/dashboard/query-options"
import { getTrendLabel, getDefaultDateRange } from "@/features/dashboard/utils"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

type PortalDashboardOutput = inferRouterOutputs<AppRouter>["portal"]["dashboard"]

/** Stable empty array so the trafficBySource memo deps never churn on load. */
const EMPTY_ACCOUNTS: PortalDashboardOutput["accounts"] = []

export function EmpDashboardClient() {
  const searchParams = useSearchParams()
  const rangeLabel = searchParams.get("range") ?? undefined
  const defaultRange = getDefaultDateRange()
  const dateFrom = searchParams.get("from") ?? defaultRange.dateFrom
  const dateTo = searchParams.get("to") ?? defaultRange.dateTo

  const { data, isLoading } = trpc.portal.dashboard.useQuery({
    dateFrom,
    dateTo,
    timezoneOffset: getTimezoneOffset(),
  })

  // Hooks must be called unconditionally — before any early returns — to keep
  // hook order stable across renders (loading vs loaded).
  const accounts = data?.accounts ?? EMPTY_ACCOUNTS

  // Aggregate per-ad-account rows by source platform for the shared chart.
  const trafficBySource = useMemo(() => {
    const sourceMap = new Map<string, { source: string; clicks: number; conversions: number }>()
    for (const account of accounts) {
      const existing = sourceMap.get(account.sourcePlatform) ?? { source: account.sourcePlatform, clicks: 0, conversions: 0 }
      existing.clicks += account.clicks
      existing.conversions += account.conversions
      sourceMap.set(account.sourcePlatform, existing)
    }
    return [...sourceMap.values()]
  }, [accounts])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background p-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        {/* KPI Cards */}
        <div className="flex w-full flex-col border-b md:flex-row">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex flex-1 flex-col justify-center border-b bg-background p-6 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
            >
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="mb-2 h-9 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 border-b border-border lg:grid-cols-3">
          <div className="border-b border-border p-6 lg:col-span-2 lg:border-r lg:border-b-0">
            <Skeleton className="mb-4 h-5 w-32" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
          <div className="p-6 lg:col-span-1">
            <Skeleton className="mb-4 h-5 w-40" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        </div>

        {/* Bottom Grid: Browser, Hourly, Conversion Trend */}
        <div className="grid grid-cols-1 border-b border-border lg:grid-cols-3">
          <div className="border-b border-border p-6 lg:col-span-1 lg:border-r lg:border-b-0">
            <Skeleton className="mb-4 h-5 w-32" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
          <div className="border-b border-border p-6 lg:col-span-1 lg:border-r lg:border-b-0">
            <Skeleton className="mb-4 h-5 w-24" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
          <div className="p-6 lg:col-span-1">
            <Skeleton className="mb-4 h-5 w-32" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
        </div>

        {/* Traffic by Source + Active Products Row */}
        <div className="grid grid-cols-1 border-b border-border lg:grid-cols-2">
          <div className="border-b border-border p-6 lg:col-span-1 lg:border-r lg:border-b-0">
            <Skeleton className="mb-4 h-5 w-32" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
          <div className="p-6 lg:col-span-1">
            <Skeleton className="mb-4 h-5 w-28" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-full rounded-md" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  const { summary, trends, revenueByPeriod, geography } = data

  const trendLabel = getTrendLabel(rangeLabel)

  return (
    <div className="flex flex-1 flex-col">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between border-b border-border bg-background p-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <PeriodSelector />
      </div>

      {/* KPI Cards */}
      <MetricHero
        trendLabel={trendLabel}
        metrics={[
          {
            label: "Revenue",
            value: summary.totalRevenue,
            trend: trends.revenueChange,
            format: "currency",
          },
          {
            label: "CR",
            value: summary.conversionRate,
            trend: trends.conversionRateChange,
            format: "percentage",
          },
          {
            label: "Conversions",
            value: summary.totalConversions,
            trend: trends.conversionsChange,
            format: "number",
          },
          {
            label: "Clicks",
            value: summary.totalClicks,
            trend: trends.clicksChange,
            format: "number",
          },
          {
            label: "Profit",
            value: summary.profit,
            trend: trends.profitChange,
            format: "currency",
          },
        ]}
      />

      {/* Main Charts Grid: Revenue Chart + Customer Segments */}
      <div className="grid grid-cols-1 border-b border-border lg:grid-cols-3">
        <div className="border-b border-border lg:col-span-2 lg:border-r lg:border-b-0">
          <RevenueChart
            data={revenueByPeriod}
            currentTotal={summary.totalRevenue}
            trend={trends.revenueChange}
            mode={data.revenueMode}
            comparisons={trends.revenueComparisons}
            trendLabel={trendLabel}
          />
        </div>
        <div className="lg:col-span-1">
          <GeographyPanel geography={geography} />
        </div>
      </div>

      {/* Bottom Grid: Browser, Hourly, Conversion Trend */}
      <div className="grid grid-cols-1 border-b border-border lg:grid-cols-3">
        <div className="border-b border-border lg:col-span-1 lg:border-r lg:border-b-0">
          <BrowserRadialChart data={data.browserBreakdown ?? []} />
        </div>
        <div className="border-b border-border lg:col-span-1 lg:border-r lg:border-b-0">
          <HourlyHeatmap data={data.hourlyData ?? []} />
        </div>
        <div className="lg:col-span-1">
          <ConversionTrend data={data.conversionTrend ?? []} />
        </div>
      </div>

      {/* Traffic by Source + Active Products Row */}
      <div className="grid grid-cols-1 border-b border-border lg:grid-cols-2">
        <div className="border-b border-border lg:col-span-1 lg:border-r lg:border-b-0">
          <TrafficBySourceChart data={trafficBySource} />
        </div>
        <div className="lg:col-span-1">
          <ActiveProductsPanel products={data.activeProductsList ?? []} />
        </div>
      </div>

      {/* Ad Account Performance */}
      <Card className="gap-0 rounded-none border-0 shadow-none pb-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconChartBar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-bold">Ad Account Performance</h3>
            </div>
            <Badge variant="secondary" className="rounded-lg text-xs font-semibold">
              {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No ad accounts with performance data yet
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-semibold">{account.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg text-xs font-medium capitalize">
                          {account.sourcePlatform}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">
                        {account.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">
                        {account.conversions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">
                        {formatCurrency(account.revenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">
                        {formatCurrency(account.payout)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={account.status === "active" ? "default" : "secondary"}
                          className="rounded-lg text-[10px] font-bold tracking-wide uppercase"
                        >
                          {account.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
