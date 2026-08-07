"use client"

import { MetricHero } from "./components/metric-hero"
import { RevenueChart } from "./components/revenue-chart"
import { GeographyPanel } from "./components/geography-panel"
import { BrowserRadialChart } from "./components/browser-radial-chart"
import { HourlyHeatmap } from "./components/hourly-heatmap"
import { ConversionTrend } from "./components/conversion-trend"
import { ActiveProductsPanel } from "./components/active-products-panel"
import { TopMediaBuyers } from "./components/top-media-buyers"
import { TrafficBySourceChart } from "./components/traffic-by-source-chart"
import { PeriodSelector } from "./components/period-selector"
import { useDashboardAnalytics } from "./queries"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { useSearchParams } from "next/navigation"
import { getTrendLabel, getDefaultDateRange } from "./utils"

export function DashboardClient() {
  const searchParams = useSearchParams()
  const rangeLabel = searchParams.get("range") ?? undefined
  const defaultRange = getDefaultDateRange()
  const dateFrom = searchParams.get("from") ?? defaultRange.dateFrom
  const dateTo = searchParams.get("to") ?? defaultRange.dateTo

  const { data, isLoading, error } = useDashboardAnalytics({ dateFrom, dateTo })

  if (isLoading) {
    return (
      <div className="flex flex-col rounded-none bg-background">
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
              className="flex flex-1 flex-col justify-center border-b p-6 bg-background last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-9 w-32 mb-2" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>

        {/* Main Charts Grid: Revenue Chart + Geography */}
        <div className="grid grid-cols-1 border-b border-border lg:grid-cols-3">
          <div className="border-b border-border p-6 lg:col-span-2 lg:border-r lg:border-b-0">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </div>
          <div className="p-6 lg:col-span-1">
            <Skeleton className="h-5 w-28 mb-4" />
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </div>
        </div>

        {/* Bottom Grid: Browser, Hourly, Conversion Trend */}
        <div className="grid grid-cols-1 border-b border-border lg:grid-cols-3">
          <div className="border-b border-border p-6 lg:col-span-1 lg:border-r lg:border-b-0">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
          <div className="border-b border-border p-6 lg:col-span-1 lg:border-r lg:border-b-0">
            <Skeleton className="h-5 w-24 mb-4" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
          <div className="p-6 lg:col-span-1">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
        </div>

        {/* Traffic by Source + Top Media Buyers Row */}
        <div className="grid grid-cols-1 border-b border-border lg:grid-cols-2">
          <div className="border-b border-border p-6 lg:col-span-1 lg:border-r lg:border-b-0">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
          <div className="p-6 lg:col-span-1">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
        </div>

        {/* Active Products Full Width */}
        <div className="border-b border-border p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-full rounded-md" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Failed to load dashboard data</p>
      </div>
    )
  }

  const { summary, trends, revenueByPeriod, geography, activeProductsList, hourlyData, conversionTrend, topMediaBuyers, trafficBySource } = data

  const trendLabel = getTrendLabel(rangeLabel)

  return (
    <div className="flex flex-col rounded-none bg-background">
      <div className="flex items-center justify-between border-b border-border bg-background p-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <PeriodSelector dateFrom={dateFrom} dateTo={dateTo} rangeLabel={rangeLabel} />
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
            value: summary.totalProfit,
            trend: trends.profitChange,
            format: "currency",
          },
        ]}
      />

      {/* Main Charts Grid: Revenue Chart + Geography */}
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
          <HourlyHeatmap data={hourlyData ?? []} />
        </div>
        <div className="lg:col-span-1">
          <ConversionTrend data={conversionTrend ?? []} />
        </div>
      </div>

      {/* Traffic by Source + Top Media Buyers Row */}
      <div className="grid grid-cols-1 border-b border-border lg:grid-cols-2">
        <div className="border-b border-border lg:col-span-1 lg:border-r lg:border-b-0">
          <TrafficBySourceChart data={trafficBySource ?? []} />
        </div>
        <div className="lg:col-span-1">
          <TopMediaBuyers data={topMediaBuyers ?? []} />
        </div>
      </div>

      {/* Active Products Full Width */}
      <div className="border-b border-border">
        <ActiveProductsPanel products={activeProductsList} />
      </div>
    </div>
  )
}
