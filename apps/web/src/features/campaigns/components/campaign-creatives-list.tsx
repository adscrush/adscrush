"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { IconPhoto } from "@tabler/icons-react"
import { useCampaignCreatives } from "../queries"
import { AssignCreativesDialog } from "./assign-creatives-dialog"

interface CampaignCreativesListProps {
  campaignId: string
  productId?: string | null
}

export function CampaignCreativesList({ campaignId, productId }: CampaignCreativesListProps) {
  const { data: result, isLoading } = useCampaignCreatives(campaignId)

  const creatives = result?.data ?? []

  if (isLoading) {
    return <CampaignCreativesListSkeleton />
  }

  if (creatives.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked Creatives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <IconPhoto className="size-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              No creatives are linked to this campaign.
            </p>
            <AssignCreativesDialog campaignId={campaignId} productId={productId} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Linked Creatives</CardTitle>
        <AssignCreativesDialog campaignId={campaignId} productId={productId} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {creatives.map((item) => {
            const thumbnail = item.creative.thumbnailUrl || item.creative.cdnUrl
            return (
              <div
                key={item.id}
                className="flex flex-col items-center gap-2 rounded-lg border p-3"
              >
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={item.creative.name}
                    className="size-20 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-md bg-muted">
                    <IconPhoto className="size-8 text-muted-foreground/50" />
                  </div>
                )}
                <span className="text-xs font-medium text-center line-clamp-2">
                  {item.creative.name}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function CampaignCreativesListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Linked Creatives</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-lg border p-3">
              <Skeleton className="size-20 rounded-md" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
