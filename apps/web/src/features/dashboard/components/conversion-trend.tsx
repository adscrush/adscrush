"use client"

import { useMemo } from "react"
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { ConversionTrendPoint } from "../types"

interface ConversionTrendProps {
  data: ConversionTrendPoint[]
}

export function ConversionTrend({ data }: ConversionTrendProps) {
  const chartData = useMemo(() => {
    return data.map((d) => {
      const date = new Date(d.date)
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      return { ...d, label }
    })
  }, [data])

  const latestCr = data.length > 0 ? data[data.length - 1]!.cr : 0
  const avgCr = data.length > 0 ? data.reduce((sum, d) => sum + d.cr, 0) / data.length : 0
  const maxCr = data.length > 0 ? Math.max(...data.map((d) => d.cr)) : 0
  const minCr = data.length > 0 ? Math.min(...data.map((d) => d.cr)) : 0

  const trend = data.length >= 2 ? data[data.length - 1]!.cr - data[0]!.cr : 0

  return (
    <div className="flex h-full flex-col bg-background p-5">
      <div className="mb-1 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Conversion Rate</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums">{latestCr.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-xs">
          <span className="text-muted-foreground">30d Range</span>
          <span className="font-mono font-bold">{minCr.toFixed(1)}% — {maxCr.toFixed(1)}%</span>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3 text-[10px] font-medium tracking-tight text-muted-foreground uppercase">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-none bg-primary" />
          {avgCr.toFixed(1)}% avg
        </span>
        <span className={`flex items-center gap-1.5 ${trend >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs 30d ago
        </span>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="crGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: "currentColor", fillOpacity: 0.4 }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload as ConversionTrendPoint & { label: string }
                return (
                  <div className="rounded-none border border-border bg-background px-3 py-2 text-sm shadow-xl">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">{d.label}</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="h-0.5 w-3 rounded-full bg-primary" />
                        <span className="text-xs text-muted-foreground">CR %</span>
                        <span className="ml-auto font-mono text-xs font-bold tabular-nums">{d.cr.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-0.5 w-3 rounded-full bg-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Clicks</span>
                        <span className="ml-auto font-mono text-xs font-bold tabular-nums">{d.clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-0.5 w-3 rounded-full bg-emerald-500" />
                        <span className="text-xs text-muted-foreground">Conv</span>
                        <span className="ml-auto font-mono text-xs font-bold tabular-nums text-emerald-500">{d.conversions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="cr"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#crGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
