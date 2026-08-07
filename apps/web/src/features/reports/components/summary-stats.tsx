"use client"

import { Card, CardContent } from "@adscrush/ui/components/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { useMemo } from "react"
import { startOfMonth, format, eachDayOfInterval, isAfter, isSameDay, endOfMonth } from "date-fns"

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number; payload: { date: string } }[]
  color: string
}

function CustomTooltip({ active, payload, color }: CustomTooltipProps) {
  const first = payload?.[0]
  if (active && first) {
    return (
      <div className="rounded-lg border bg-card p-2 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            {format(new Date(first.payload.date), "do MMM")}
          </span>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {new Intl.NumberFormat("en-US").format(first.value)}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

interface SummaryStatsData {
  clicks: number
  conversions: number
  revenue: number
  payout: number
}

interface TrendDataItem {
  date: string
  clicks: number
  conversions: number
  revenue: number
  payout: number
}

interface SummaryStatsProps {
  overview?: SummaryStatsData
  trendData?: TrendDataItem[]
  isLoading: boolean
}

export function SummaryStats({ overview, trendData, isLoading }: SummaryStatsProps) {
  const stats = useMemo(() => {
    const totals = overview || { clicks: 0, conversions: 0, revenue: 0, payout: 0 }
    const items = trendData || []

    const itemsMap = new Map<string, TrendDataItem>()
    items.forEach((item) => {
      const dateKey = format(new Date(item.date), "yyyy-MM-dd")
      itemsMap.set(dateKey, item)
    })

    const now = new Date()
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(now),
      end: endOfMonth(now),
    })

    const paddedTrend = daysInMonth.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd")
      const match = itemsMap.get(dayStr)
      const isFuture = isAfter(day, now) && !isSameDay(day, now)

      return {
        date: day.toISOString(),
        clicks: Number(match?.clicks || 0),
        conversions: Number(match?.conversions || 0),
        revenue: Number(match?.revenue || 0),
        payout: Number(match?.payout || 0),
        isFuture,
      }
    })

    return [
      {
        label: "Clicks (MTD)",
        value: new Intl.NumberFormat("en-US").format(totals.clicks),
        trend: paddedTrend.map((d) => ({ value: d.clicks, date: d.date })),
        color: "#5b69da",
      },
      {
        label: "Conversions (MTD)",
        value: new Intl.NumberFormat("en-US").format(totals.conversions),
        trend: paddedTrend.map((d) => ({ value: d.conversions, date: d.date })),
        color: "#ea8a72",
      },
      {
        label: "Revenue (MTD)",
        value: new Intl.NumberFormat("en-US").format(totals.revenue),
        unit: "USD",
        trend: paddedTrend.map((d) => ({ value: d.revenue, date: d.date })),
        color: "#5b69da",
      },
      {
        label: "Payout (MTD)",
        value: new Intl.NumberFormat("en-US").format(totals.payout),
        unit: "USD",
        trend: paddedTrend.map((d) => ({ value: d.payout, date: d.date })),
        color: "#ea8a72",
      },
      {
        label: "Profit (MTD)",
        value: new Intl.NumberFormat("en-US").format(totals.revenue - totals.payout),
        unit: "USD",
        trend: paddedTrend.map((d) => ({ value: d.revenue - d.payout, date: d.date })),
        color: "#5b69da",
      },
      {
        label: "Conversion Rate (MTD)",
        value: totals.clicks > 0 ? (totals.conversions / totals.clicks * 100).toFixed(2) : "0.00",
        unit: "%",
        trend: paddedTrend.map((d) => ({ 
          value: d.clicks > 0 ? (d.conversions / d.clicks * 100) : 0, 
          date: d.date 
        })),
        color: "#5b69da",
      },
    ]
  }, [overview, trendData])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-0 border-y border-border/50 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card
            key={i}
            className="rounded-none border-0 border-r border-border/50 bg-card/50 shadow-none last:border-r-0"
          >
            <CardContent className="flex flex-col gap-1 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-2 h-[45px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-1 gap-0 border-y border-border/50 bg-card/50 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="rounded-none border-0 border-r border-border/50 bg-transparent shadow-none last:border-r-0"
          >
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-[12px] font-medium text-muted-foreground">{stat.label}</span>
              <div className="flex h-8 items-baseline gap-1.5">
                <span className="text-[22px] font-semibold tracking-tight text-foreground/90 tabular-nums">
                  {stat.value}
                </span>
                {stat.unit && <span className="text-[11px] font-medium text-muted-foreground/60">{stat.unit}</span>}
              </div>

              <div className="mt-2 h-[45px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stat.trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={stat.color} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={stat.color} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      content={<CustomTooltip color={stat.color} />}
                      cursor={{ stroke: stat.color, strokeWidth: 1, strokeDasharray: "3 3" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={stat.color}
                      strokeWidth={2}
                      fill={`url(#gradient-${i})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* <div className="absolute bottom-2 right-4">
        <Button variant="outline" size="sm" className="h-7 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/10 hover:bg-emerald-500/20 gap-1.5 font-bold">
          <Sparkles className="size-3.5 fill-current opacity-20" />
          AI Analyze
        </Button>
      </div> */}
    </div>
  )
}
