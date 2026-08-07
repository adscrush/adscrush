"use client"

import * as React from "react"
import { Card, CardContent } from "@adscrush/ui/components/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@adscrush/ui/lib/utils"
import { formatCurrency, formatPercentage, formatCompactNumber, formatTrend } from "../utils"

export interface KpiCardProps {
  label: string
  value: number
  trend?: number
  format: "currency" | "percentage" | "number"
}

export function KpiCard({ label, value, trend, format }: KpiCardProps) {
  const trendInfo = trend !== undefined ? formatTrend(trend) : null

  const formattedValue = (() => {
    switch (format) {
      case "currency":
        return formatCurrency(value)
      case "percentage":
        return formatPercentage(value)
      case "number":
      default:
        return formatCompactNumber(value)
    }
  })()

  return (
    <Card className="overflow-hidden rounded-none border-0 bg-muted/50">
      <CardContent className="p-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{formattedValue}</p>
          {trendInfo && (
            <div className="flex items-center gap-1 text-xs">
              {trendInfo.sign === "+" ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={cn(trendInfo.sign === "+" ? "text-green-500" : "text-red-500")}>
                {trendInfo.formatted}
              </span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
