"use client"

import { useMemo } from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@adscrush/ui/lib/utils"
import { formatCompactNumber, formatTrend } from "../utils"
import type { CustomerSegment } from "../types"
import { Button } from "@adscrush/ui/components/button"

interface CustomerVennPanelProps {
  segments: CustomerSegment[]
  totalConversions: number
  totalTrend: number
}

export function CustomerVennPanel({ segments, totalConversions, totalTrend }: CustomerVennPanelProps) {
  // Determine circle parameters based on share and color
  const circles = useMemo(() => {
    // Standard layout for 3 circles
    const positions = [
      { cx: 100, cy: 50 }, // Top
      { cx: 70, cy: 95 },  // Bottom Left
      { cx: 130, cy: 95 }, // Bottom Right
    ]
    
    return segments.map((seg, idx) => {
      const radius = 45 // Fixed radius for a clean Venn look
      const pos = positions[idx] || { cx: 100, cy: 75 }
      return { ...seg, radius, ...pos }
    })
  }, [segments])

  const trendInfo = formatTrend(totalTrend)
  const isPositive = totalTrend >= 0

  const viewBox = "0 0 200 160"

  return (
    <div className="p-6 h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
          <h3 className="mt-1 text-3xl font-bold tracking-tight">{formatCompactNumber(totalConversions)}</h3>
          <div className="mt-2 flex items-center gap-1 text-sm font-medium">
            <span className={cn(isPositive ? "text-emerald-500" : "text-rose-500")}>
              {trendInfo.formatted}
            </span>
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 rounded-none text-xs font-semibold">
          Details
        </Button>
      </div>

      <div className="relative mt-4 flex items-center justify-center">
        <div className="h-[180px] w-full max-w-[220px]">
          <svg viewBox={viewBox} className="overflow-visible drop-shadow-sm">
            {circles.map((circle, idx) => (
              <circle
                key={idx}
                cx={circle.cx}
                cy={circle.cy}
                r={circle.radius}
                fill="#E5E7EB"
                fillOpacity={0.5}
                stroke="#D1D5DB"
                strokeWidth="1"
              />
            ))}
            {/* percentage labels in the centers */}
            {circles.map((circle, idx) => (
              <text
                key={`label-${idx}`}
                x={circle.cx}
                y={circle.cy}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-foreground text-[10px] font-bold"
              >
                {circle.share.toFixed(0)}%
              </text>
            ))}
          </svg>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {segments.map((seg, idx) => {
          const trend = seg.trend
          const isSegPositive = trend >= 0
          const segTrend = formatTrend(trend)
          return (
            <div key={idx} className="flex items-center justify-between text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-muted-foreground">{seg.segment}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{formatCompactNumber(seg.count)}</span>
                <div className={cn("flex w-16 items-center justify-end gap-0.5", isSegPositive ? "text-emerald-500" : "text-rose-500")}>
                  {isSegPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  <span className="text-xs font-bold">{segTrend.formatted}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
