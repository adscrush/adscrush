"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { IconPhoto, IconDownload } from "@tabler/icons-react"
import { Button } from "@adscrush/ui/components/button"
import { trpc } from "@/lib/trpc/client"
import { useState } from "react"

interface CampaignCreativePerformanceProps {
  campaignId: string
}

type Period = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "all_time"

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "all_time", label: "All Time" },
]

export function CampaignCreativePerformance({ campaignId }: CampaignCreativePerformanceProps) {
  const [period, setPeriod] = useState<Period>("this_month")

  const { data, isLoading } = trpc.campaigns.getCreativePerformance.useQuery({
    campaignId,
    period,
  })

  const handleExport = () => {
    if (!data || data.length === 0) return

    const headers = ["Creative ID", "Creative Name", "Clicks", "Unique Clicks", "Conversions", "Approved Conversions", "Revenue", "Payout", "Profit", "CR%", "RPC", "EPC"]
    const rows = data.map((row) => [
      row.creativeId,
      row.creativeName,
      row.clicks,
      row.uniqueClicks,
      row.conversions,
      row.approvedConversions,
      row.revenue,
      row.payout,
      row.profit,
      row.cr.toFixed(2),
      row.rpc.toFixed(2),
      row.epc.toFixed(2),
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `creative-performance-${campaignId}-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Creative Performance</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border p-1">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!data || data.length === 0}
          >
            <IconDownload className="mr-2 size-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                <Skeleton className="size-12 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconPhoto className="size-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No creative performance data available for this period.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Assign creatives and generate tracking links to start tracking performance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-2 text-left font-medium text-muted-foreground">Creative</th>
                  <th className="py-3 px-2 text-right font-medium text-muted-foreground">Clicks</th>
                  <th className="py-3 px-2 text-right font-medium text-muted-foreground">Unique</th>
                  <th className="py-3 px-2 text-right font-medium text-muted-foreground">Conv.</th>
                  <th className="py-3 px-2 text-right font-medium text-muted-foreground">Rate</th>
                  <th className="py-3 px-2 text-right font-medium text-muted-foreground">Revenue</th>
                  <th className="py-3 px-2 text-right font-medium text-muted-foreground">Cost</th>
                  <th className="py-3 px-2 text-right font-medium text-muted-foreground">Profit</th>
                  <th className="py-3 px-2 text-right font-medium text-muted-foreground">RPC</th>
                  <th className="py-3 px-2 text-right font-medium text-muted-foreground">EPC</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.creativeId} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        {row.creativeThumbnailUrl ? (
                          <img
                            src={row.creativeThumbnailUrl}
                            alt={row.creativeName}
                            className="size-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                            <IconPhoto className="size-5 text-muted-foreground/50" />
                          </div>
                        )}
                        <span className="font-medium truncate max-w-[200px]">{row.creativeName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right tabular-nums">{row.clicks.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right tabular-nums">{row.uniqueClicks.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right tabular-nums">{row.conversions.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right tabular-nums">
                      <span className={row.cr > 0 ? "text-green-600" : "text-muted-foreground"}>
                        {row.cr.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right tabular-nums">${row.revenue.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right tabular-nums">${row.payout.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right tabular-nums">
                      <span className={row.profit > 0 ? "text-green-600" : row.profit < 0 ? "text-red-600" : ""}>
                        ${row.profit.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right tabular-nums">${row.rpc.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right tabular-nums">${row.epc.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
