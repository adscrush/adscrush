"use client"

import * as React from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@adscrush/ui/lib/utils"
import { formatCurrency, formatPercentage, formatCompactNumber, formatTrend } from "../utils"

export interface MetricHeroItem {
  label: string
  value: number
  trend?: number
  format: "currency" | "percentage" | "number"
}

interface MetricHeroProps {
  metrics: MetricHeroItem[]
  trendLabel?: string
}

export function MetricHero({ metrics, trendLabel = "vs Yesterday" }: MetricHeroProps) {
  return (
    <div className="flex w-full flex-col border-b md:flex-row">
      {metrics.map((metric, index) => {
        // Always show trend — use neutral gray when no data to compare
        const trendInfo = formatTrend(metric.trend ?? 0)
        
        const formattedValue = (() => {
          switch (metric.format) {
            case "currency":
              return formatCurrency(metric.value)
            case "percentage":
              return formatPercentage(metric.value)
            case "number":
            default:
              return formatCompactNumber(metric.value)
          }
        })()

        // Only colorize when there's actual data AND a non-zero trend
        const hasData = metric.value > 0
        const hasTrend = metric.trend !== undefined && metric.trend !== 0
        const isPositive = hasData && hasTrend && metric.trend! > 0
        const isNegative = hasData && hasTrend && metric.trend! < 0

        return (
          <div
            key={metric.label}
            className={cn(
              "flex flex-1 flex-col justify-center p-6 bg-background",
              index !== metrics.length - 1 && "border-b md:border-b-0 md:border-r"
            )}
          >
            <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
            <div className="mt-2 flex items-baseline justify-between md:block lg:flex">
              <h3 className="text-3xl font-bold tracking-tight">{formattedValue}</h3>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : isNegative ? (
                <ArrowDownRight className="h-4 w-4 text-rose-500" />
              ) : null}
              <span
                className={cn(
                  isPositive && "text-emerald-500",
                  isNegative && "text-rose-500",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}
              >
                {trendInfo.formatted}
              </span>
              <span className="text-muted-foreground">{trendLabel}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
