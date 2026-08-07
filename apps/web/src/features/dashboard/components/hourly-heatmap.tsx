"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { HourlyDataPoint } from "../types"

interface HourlyHeatmapProps {
  data: HourlyDataPoint[]
}

export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
  const maxClicks = useMemo(() => Math.max(...data.map((d) => d.clicks), 1), [data])

  // Timezone conversion is now handled in the backend SQL query
  // Data comes already converted to local timezone hours
  const chartData = useMemo(() => {
    return data.map((d) => ({
      hour: `${String(d.hour).padStart(2, "0")}:00`,
      hourNum: d.hour,
      clicks: d.clicks,
      conversions: d.conversions,
    }))
  }, [data])

  const totalClicks = useMemo(() => data.reduce((sum, d) => sum + d.clicks, 0), [data])
  const totalConversions = useMemo(() => data.reduce((sum, d) => sum + d.conversions, 0), [data])

  const peakHour = useMemo(() => {
    const max = data.reduce((best, d) => (d.clicks > best.clicks ? d : best), data[0] ?? { hour: 0, clicks: 0 })
    return max.hour
  }, [data])

  return (
    <div className="flex h-full flex-col bg-background p-5">
      <div className="mb-1 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Hourly Activity</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums">{totalClicks.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Clicks</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-xs">
          <span className="text-muted-foreground">Peak</span>
          <span className="font-mono font-bold">{String(peakHour).padStart(2, "0")}:00</span>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3 text-[10px] font-medium tracking-tight text-muted-foreground uppercase">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-none bg-primary" />
          {totalConversions.toLocaleString()} conv
        </span>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: "currentColor", fillOpacity: 0.4 }}
              interval={2}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload as { hour: string; clicks: number; conversions: number }
                return (
                  <div className="rounded-none border border-border bg-background px-3 py-2 text-sm shadow-xl">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">{d.hour}</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="h-0.5 w-3 rounded-full bg-primary" />
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
            <Bar dataKey="clicks" radius={[2, 2, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.hourNum}
                  fill={`var(--primary)`}
                  fillOpacity={maxClicks > 0 ? 0.15 + (entry.clicks / maxClicks) * 0.85 : 0.15}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
