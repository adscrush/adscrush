"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@adscrush/ui/components/tooltip"
import { IconAlertCircle } from "@tabler/icons-react"

import { useCampaignStats } from "../queries"

interface CampaignStatsCardsProps {
  campaignId: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

export function CampaignStatsCards({ campaignId }: CampaignStatsCardsProps) {
  const { data, isLoading, isError } = useCampaignStats(campaignId)

  if (isLoading) {
    return <CampaignStatsCardsSkeleton />
  }

  if (isError) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-6">
              <div className="flex items-center gap-2 text-destructive">
                <IconAlertCircle className="size-4" />
                <span className="text-xs">Failed to load</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = data?.data

  const cards = [
    { title: "Clicks", value: formatNumber(stats?.clicks ?? 0) },
    { title: "Conversions", value: formatNumber(stats?.conversions ?? 0) },
    { title: "EPC", value: formatCurrency(stats?.epc ?? 0), tooltip: "Earnings per click — total payout divided by total clicks" },
    { title: "Revenue", value: formatCurrency(stats?.revenue ?? 0) },
    { title: "Payout", value: formatCurrency(stats?.payout ?? 0) },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dashed border-muted-foreground/50">{card.title}</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-48 text-xs">{card.tooltip}</TooltipContent>
                </Tooltip>
              ) : (
                card.title
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CampaignStatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
