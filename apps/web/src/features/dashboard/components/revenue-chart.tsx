"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, CartesianGrid } from "recharts"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { formatCurrency, formatTrend } from "../utils"
import type { RevenuePeriod } from "../types"
import { cn } from "@adscrush/ui/lib/utils"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@adscrush/ui/components/chart"

interface RevenueChartProps {
  data: RevenuePeriod[]
  currentTotal: number
  trend: number
  mode: "daily" | "monthly"
  comparisons: {
    "4w": number
    "13w": number
    "12m": number
  }
  trendLabel?: string
}

const chartConfig = {
  clicks: {
    label: "Clicks",
    color: "var(--chart-1)",
  },
  conversions: {
    label: "Conversions",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function RevenueTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const clicks = payload.find((p) => p.name === "clicks")?.value ?? 0
  const conversions = payload.find((p) => p.name === "conversions")?.value ?? 0
  const cr = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : "0.0"

  return (
    <div className="rounded-none border border-border bg-background px-3 py-2 text-sm shadow-xl">
      {label && <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="flex flex-col gap-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-0.5 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-muted-foreground">{entry.name === "clicks" ? "Clicks" : "Conversions"}</span>
            <span className="ml-auto font-mono text-xs font-bold tabular-nums">{entry.value.toLocaleString()}</span>
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2 border-t border-border pt-1.5">
          <div className="h-0.5 w-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">CR %</span>
          <span className="ml-auto font-mono text-xs font-bold tabular-nums text-emerald-500">{cr}%</span>
        </div>
      </div>
    </div>
  )
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function RevenueChart({ data, currentTotal, trend, comparisons, mode, trendLabel = "vs Previous Period" }: RevenueChartProps) {
  const formattedData = useMemo(() => {
    if (mode === "daily") {
      // Daily mode: show each day with short date label (e.g. "Mar 5")
      return data.map((d) => {
        const date = new Date(d.period)
        const label = `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`
        return {
          label,
          period: d.period,
          revenue: d.revenue,
          clicks: d.clicks,
          conversions: d.conversions,
        }
      })
    }

    // Monthly mode: aggregate data by month index
    const dataByMonth = new Map<number, { revenue: number; clicks: number; conversions: number; period: string }>()
    for (const d of data) {
      const date = new Date(d.period)
      const monthIdx = date.getMonth()
      const existing = dataByMonth.get(monthIdx)
      if (existing) {
        existing.revenue += d.revenue
        existing.clicks += d.clicks
        existing.conversions += d.conversions
      } else {
        dataByMonth.set(monthIdx, {
          revenue: d.revenue,
          clicks: d.clicks,
          conversions: d.conversions,
          period: d.period,
        })
      }
    }

    // Always show all 12 months
    return MONTHS.map((label, idx) => {
      const existing = dataByMonth.get(idx)
      return {
        label,
        period: existing?.period ?? `${new Date().getFullYear()}-${String(idx + 1).padStart(2, "0")}`,
        revenue: existing?.revenue ?? 0,
        clicks: existing?.clicks ?? 0,
        conversions: existing?.conversions ?? 0,
      }
    })
  }, [data, mode])

  const trendInfo = formatTrend(trend)
  const isPositive = trend >= 0

  return (
    <div className="bg-background p-6 h-full">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Sales Revenue</p>
          <h3 className="mt-1 text-4xl font-bold tracking-tight">{formatCurrency(currentTotal)}</h3>
          <div className="mt-2 flex items-center gap-1 text-sm font-medium">
            <span className={cn(isPositive ? "text-emerald-500" : "text-rose-500")}>
              {trendInfo.formatted}
            </span>
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            )}
            <span className="text-muted-foreground ml-1">{trendLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {Object.entries(comparisons).map(([key, val]) => {
            const compTrend = formatTrend(val)
            const isCompPositive = val >= 0
            return (
              <div key={key} className="flex items-center gap-2 rounded-none border bg-muted/30 px-3 py-1.5 text-xs font-medium">
                <span className="text-muted-foreground">{key}</span>
                <div className={cn("flex items-center gap-0.5", isCompPositive ? "text-emerald-500" : "text-rose-500")}>
                  {isCompPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span>{compTrend.formatted}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-10 h-[300px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart accessibilityLayer data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 10, fontWeight: 500 }}
            />
            <ChartTooltip content={<RevenueTooltipContent />} cursor={false} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="clicks"
              stackId="a"
              fill="var(--color-clicks)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="conversions"
              stackId="a"
              fill="var(--color-conversions)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
