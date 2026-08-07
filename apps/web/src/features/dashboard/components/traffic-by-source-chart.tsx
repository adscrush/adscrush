"use client"

import { useMemo, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Button } from "@adscrush/ui/components/button"
import type { TrafficBySourceItem } from "../types"

interface TrafficBySourceChartProps {
  data: TrafficBySourceItem[]
}

const CLICK_COLOR = "var(--primary)"
const CONV_COLOR = "color-mix(in oklch, var(--primary) 55%, var(--background))"

const PIE_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(160, 84%, 40%)",
  "hsl(45, 93%, 47%)",
  "hsl(346, 77%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(15, 92%, 55%)",
  "hsl(199, 89%, 48%)",
  "hsl(142, 71%, 45%)",
]

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { source: string; clicks: number; conversions: number; total: number; share: number } }>
}) {
  if (!active || !payload?.length || !payload[0]) return null
  const data = payload[0].payload

  return (
    <div className="pointer-events-none z-[100] border border-border bg-background px-4 py-3 shadow-2xl">
      <p className="text-sm font-bold tracking-tight uppercase">{data.source}</p>
      <div className="mt-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-none" style={{ backgroundColor: CLICK_COLOR }} />
          <span className="text-muted-foreground">Clicks:</span>
          <span className="font-mono font-bold tabular-nums">{data.clicks.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-none" style={{ backgroundColor: CONV_COLOR }} />
          <span className="text-muted-foreground">Conversions:</span>
          <span className="font-mono font-bold tabular-nums">{data.conversions.toLocaleString()}</span>
        </div>
        <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-none bg-muted/30">
          <div className="h-full" style={{ width: `${data.total > 0 ? (data.clicks / data.total) * 100 : 0}%`, backgroundColor: CLICK_COLOR }} />
          <div className="h-full" style={{ width: `${data.total > 0 ? (data.conversions / data.total) * 100 : 0}%`, backgroundColor: CONV_COLOR }} />
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
          <span>{data.share.toFixed(1)}% share</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Traffic by Source — donut chart with chart/list toggle.
 *
 * Shared by the admin dashboard (pre-aggregated `trafficBySource`) and the
 * media-buyer portal (ad accounts aggregated by sourcePlatform before
 * passing in). Callers must pass data already grouped by source.
 */
export function TrafficBySourceChart({ data }: TrafficBySourceChartProps) {
  const [viewMode, setViewMode] = useState<"chart" | "list">("chart")

  const chartData = useMemo(() => {
    const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0)
    const totalConvs = data.reduce((sum, d) => sum + d.conversions, 0)
    const grandTotal = totalClicks + totalConvs

    return data
      .map((d) => ({
        source: d.source,
        clicks: d.clicks,
        conversions: d.conversions,
        total: d.clicks + d.conversions,
        share: grandTotal > 0 ? ((d.clicks + d.conversions) / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [data])

  const totalClicks = useMemo(() => data.reduce((sum, d) => sum + d.clicks, 0), [data])
  const totalConvs = useMemo(() => data.reduce((sum, d) => sum + d.conversions, 0), [data])
  const grandTotal = totalClicks + totalConvs

  const clickPct = grandTotal > 0 ? (totalClicks / grandTotal) * 100 : 0
  const convPct = grandTotal > 0 ? (totalConvs / grandTotal) * 100 : 0

  return (
    <div className="relative flex h-full flex-col gap-4 bg-background p-4 sm:gap-5 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Traffic by Source</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums">
              {totalClicks.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">Clicks</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-none px-2 text-xs"
          onClick={() => setViewMode(viewMode === "chart" ? "list" : "chart")}
        >
          {viewMode === "chart" ? "Details" : "Chart"}
        </Button>
      </div>

      {/* Action Breakdown Progress Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex h-1.5 w-full overflow-hidden rounded-none bg-muted/30">
          <div className="h-full transition-all duration-500 ease-out" style={{ width: `${clickPct}%`, backgroundColor: CLICK_COLOR }} />
          <div className="h-full transition-all duration-500 ease-out" style={{ width: `${convPct}%`, backgroundColor: CONV_COLOR }} />
        </div>
        <div className="flex items-center gap-3 text-[10px] font-medium tracking-tight text-muted-foreground uppercase">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-none" style={{ backgroundColor: CLICK_COLOR }} />
            Click {clickPct.toFixed(1)}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-none" style={{ backgroundColor: CONV_COLOR }} />
            Conversion {convPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Donut Chart + Legend or List View */}
      {grandTotal === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          No traffic data available
        </div>
      ) : viewMode === "chart" ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-[160px] w-[160px]" style={{ zIndex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="total"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                  allowEscapeViewBox={{ x: true, y: true }}
                  offset={10}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground">Total</span>
              <span className="text-sm font-bold tabular-nums">
                {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2">
            {chartData.map((item, index) => (
              <div key={item.source} className="group">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 flex-shrink-0 rounded-none"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-xs font-semibold">{item.source}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs tabular-nums">
                    <span className="font-semibold">{item.clicks.toLocaleString()}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground font-medium">{item.conversions.toLocaleString()} conv</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground font-medium">{item.share.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${grandTotal > 0 ? (item.clicks / grandTotal) * 100 : 0}%`,
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      opacity: 1,
                    }}
                  />
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${grandTotal > 0 ? (item.conversions / grandTotal) * 100 : 0}%`,
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      opacity: 0.5,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="mt-2 flex flex-col gap-1 overflow-y-auto">
          <div className="flex items-center gap-3 px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span className="w-4" />
            <span className="flex-1">Source</span>
            <span className="w-16 text-right">Clicks</span>
            <span className="w-16 text-right">Conv</span>
            <span className="w-12 text-right">Share</span>
            <span className="w-16">Bar</span>
          </div>
          {chartData.map((item, index) => (
            <div
              key={item.source}
              className="group relative flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
            >
              <div className="pointer-events-none absolute -top-12 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap border border-border bg-background/95 px-3 py-2 shadow-xl backdrop-blur-sm group-hover:block">
                <p className="text-xs font-bold">{item.source}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.clicks.toLocaleString()} clicks | {item.conversions.toLocaleString()} conv | {item.share.toFixed(1)}%
                </p>
              </div>
              <span className="h-3 w-3 flex-shrink-0 rounded-none" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
              <span className="flex-1 text-xs font-medium truncate">{item.source}</span>
              <span className="font-mono text-xs font-bold tabular-nums w-16 text-right">{item.clicks.toLocaleString()}</span>
              <span className="font-mono text-xs font-bold tabular-nums w-16 text-right">{item.conversions.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground w-12 text-right tabular-nums">{item.share.toFixed(1)}%</span>
              <div className="flex h-1.5 w-16 overflow-hidden rounded-full bg-muted/30">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${grandTotal > 0 ? (item.clicks / grandTotal) * 100 : 0}%`,
                    backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                  }}
                />
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${grandTotal > 0 ? (item.conversions / grandTotal) * 100 : 0}%`,
                    backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                    opacity: 0.5,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
