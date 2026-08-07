"use client"

import { Badge } from "@adscrush/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { formatDate } from "@adscrush/shared/lib/format"
import { IconPhoto, IconExternalLink, IconWorld } from "@tabler/icons-react"
import Link from "next/link"
import { CampaignStatsCards } from "./campaign-stats-cards"
import type { CampaignDetail } from "../queries"
import type { FunnelDetail } from "@/features/funnels/queries"

interface CampaignOverviewTabProps {
  campaign: NonNullable<CampaignDetail>
  funnelData?: FunnelDetail | null
}

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  paused: "outline",
  expired: "destructive",
}

const lpStatusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
}

export function CampaignOverviewTab({ campaign, funnelData }: CampaignOverviewTabProps) {
  const landingPages = funnelData?.landingPages ?? []

  return (
    <div className="flex flex-col gap-6">
      <CampaignStatsCards campaignId={campaign.id} />

      {/* Campaign Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Funnel</dt>
              <dd className="mt-1 text-sm font-medium">
                {campaign.funnel ? (
                  <Link
                    href={`/funnels/${campaign.funnel.id}`}
                    className="underline-offset-2 hover:text-primary hover:underline"
                  >
                    {campaign.funnel.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <Badge variant={statusVariantMap[campaign.status] ?? "outline"} className="uppercase">
                  {campaign.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Start Date</dt>
              <dd className="mt-1 text-sm">
                {campaign.startDate
                  ? formatDate(campaign.startDate, { year: "numeric", month: "short", day: "numeric" })
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">End Date</dt>
              <dd className="mt-1 text-sm">
                {campaign.endDate
                  ? formatDate(campaign.endDate, { year: "numeric", month: "short", day: "numeric" })
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1 text-sm">
                {formatDate(campaign.createdAt, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Last Updated</dt>
              <dd className="mt-1 text-sm">
                {formatDate(campaign.updatedAt, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </dd>
            </div>
          </dl>

          {campaign.internalNotes && (
            <div className="mt-4 pt-4 border-t">
              <dt className="text-xs font-medium text-muted-foreground">Internal Notes</dt>
              <dd className="mt-1 text-sm whitespace-pre-wrap">{campaign.internalNotes}</dd>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Details & Landing Pages - Side by Side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.product ? (
              <div className="flex items-start gap-4">
                {campaign.product.image ? (
                  <img
                    src={campaign.product.image}
                    alt={campaign.product.name}
                    className="h-20 w-20 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted">
                    <IconPhoto className="size-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex flex-col gap-1 min-w-0">
                  <Link
                    href={`/products/${campaign.product.id}`}
                    className="text-sm font-medium underline-offset-2 hover:text-primary hover:underline truncate"
                  >
                    {campaign.product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    ID: {campaign.product.id}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <IconPhoto className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No product assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Landing Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Landing Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {landingPages.length > 0 ? (
              <div className="divide-y rounded-lg border">
                {landingPages.map((lp) => (
                  <div key={lp.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <IconWorld className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">{lp.name}</span>
                      <Badge
                        variant={lpStatusVariantMap[lp.status] ?? "outline"}
                        className="shrink-0 h-4 px-1 text-[9px] uppercase"
                      >
                        {lp.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {lp.weight != null && (
                        <span className="text-[10px] text-muted-foreground">
                          {lp.weight}%
                        </span>
                      )}
                      <a
                        href={lp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground truncate max-w-[180px]"
                        title={lp.url}
                      >
                        <span className="truncate">{lp.url}</span>
                        <IconExternalLink className="size-3 shrink-0" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <IconWorld className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No landing pages configured</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
