"use client"

import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adscrush/ui/components/tabs"
import { IconEdit, IconTrash } from "@tabler/icons-react"
import Link from "next/link"
import { useState } from "react"
import { PermissionGate } from "@/components/permission-gate"
import { trpc } from "@/lib/trpc/client"
import { useCampaign } from "../queries"
import { CampaignOverviewTab } from "./campaign-overview-tab"
import { CampaignCreativesTab } from "./campaign-creatives-tab"
import { CampaignAdAccountsTab } from "./campaign-ad-accounts-tab"
import { CampaignCreativePerformance } from "./campaign-creative-performance"

interface CampaignDetailsProps {
  id: string
}

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  paused: "outline",
  expired: "destructive",
}

const CAMPAIGN_TABS = [
  { value: "overview", label: "Overview" },
  { value: "creatives", label: "Creatives" },
  { value: "ad-accounts", label: "Ad Accounts" },
  { value: "performance", label: "Performance" },
] as const

export function CampaignDetails({ id }: CampaignDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const { data: result, isLoading } = useCampaign(id)

  const campaign = result?.data

  const funnelQuery = trpc.funnels.byId.useQuery(
    { id: campaign?.funnelId ?? "" },
    { enabled: !!campaign?.funnelId }
  )
  const productId = funnelQuery.data?.productId ?? null

  if (isLoading) {
    return <CampaignDetailsSkeleton />
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-semibold">Campaign not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The campaign you are looking for does not exist or you do not have access to it.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
            <Badge variant={statusVariantMap[campaign.status] ?? "outline"} className="uppercase">
              {campaign.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <PermissionGate permission="campaigns.edit">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/campaigns/${id}/edit`}>
                  <IconEdit data-icon="inline-start" />
                  Edit
                </Link>
              </Button>
            </PermissionGate>
            <PermissionGate permission="campaigns.delete">
              <Button size="sm" variant="destructive" asChild>
                <Link href={`/campaigns/${id}?action=delete`}>
                  <IconTrash data-icon="inline-start" />
                  Delete
                </Link>
              </Button>
            </PermissionGate>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage and monitor details for {campaign.name}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="w-full justify-start">
          {CAMPAIGN_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <CampaignOverviewTab campaign={campaign} funnelData={funnelQuery.data} />
        </TabsContent>

        <TabsContent value="creatives">
          <CampaignCreativesTab campaignId={id} productId={productId} />
        </TabsContent>

        <TabsContent value="ad-accounts">
          <CampaignAdAccountsTab
            campaignId={id}
            funnelId={campaign.funnelId}
          />
        </TabsContent>

        <TabsContent value="performance">
          <CampaignCreativePerformance campaignId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CampaignDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-48" />
      </div>

      <Skeleton className="h-10 w-full" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-48" />
    </div>
  )
}
