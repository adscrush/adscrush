"use client"

import { useMemo } from "react"
import { Avatar, AvatarFallback } from "@adscrush/ui/components/avatar"
import { Badge } from "@adscrush/ui/components/badge"

interface MediaBuyerData {
  id: string
  name: string
  email: string
  clicks: number
  conversions: number
  revenue: number
  conversionRate: number
}

interface TopMediaBuyersProps {
  data: MediaBuyerData[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TopMediaBuyers({ data }: TopMediaBuyersProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [data])

  const totalRevenue = useMemo(() => data.reduce((sum, d) => sum + d.revenue, 0), [data])

  if (data.length === 0) {
    return (
      <div className="flex h-full flex-col bg-background p-5">
        <div className="mb-4 flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Top Media Buyers</span>
          <span className="text-xs text-muted-foreground">No media buyer data available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Top Media Buyers</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums">{formatCurrency(totalRevenue)}</span>
            <span className="text-xs text-muted-foreground">Revenue</span>
          </div>
        </div>
        <Badge variant="secondary" className="rounded-lg text-xs font-semibold">
          {data.length} buyer{data.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {sortedData.map((buyer) => {
            const revenueShare = totalRevenue > 0 ? (buyer.revenue / totalRevenue) * 100 : 0
            const cr = buyer.clicks > 0 ? (buyer.conversions / buyer.clicks) * 100 : 0

            return (
              <div key={buyer.id} className="group relative flex items-center gap-3">
                {/* Avatar - uses built-in hash-based colors from AvatarFallback */}
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs font-semibold">
                    {getInitials(buyer.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{buyer.name}</span>
                    <span className="font-mono text-xs font-bold tabular-nums">{formatCurrency(buyer.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{buyer.clicks.toLocaleString()} clicks</span>
                    <span>•</span>
                    <span>{buyer.conversions.toLocaleString()} conv</span>
                    <span>•</span>
                    <span className={cr > 0 ? "text-emerald-500 font-medium" : ""}>{cr.toFixed(1)}% CR</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted/30">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${revenueShare}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
