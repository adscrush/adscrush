"use client"

import * as React from "react"
import { trpc } from "@/lib/trpc/client"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adscrush/ui/components/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@adscrush/ui/components/tooltip"
import { toast } from "@adscrush/ui/sonner"
import { IconArrowLeft, IconEdit, IconPhoto, IconX } from "@tabler/icons-react"
import Link from "next/link"
import { formatDate } from "@adscrush/shared/lib/format"
import { CampaignForm } from "@/features/campaigns/components/campaign-form"
import type { CreateCampaignFormInput } from "@/features/campaigns/validations"
import { PortalCampaignAdAccounts } from "@/features/portal/components/portal-campaign-ad-accounts"
import { portalCampaignKeys } from "@/features/portal/queries/campaigns"

interface PortalCampaignDetailClientProps {
  id: string
  /** Whether the buyer can edit this campaign — holds `campaigns.edit` or, as
   * the creator, `campaigns.create`. */
  canEdit: boolean
}

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  paused: "outline",
  expired: "destructive",
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

export function PortalCampaignDetailClient({ id, canEdit }: PortalCampaignDetailClientProps) {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = React.useState("overview")
  const [editing, setEditing] = React.useState(false)

  const campaignQuery = trpc.portal.campaignById.useQuery({ id })
  const campaign = campaignQuery.data

  const statsQuery = trpc.portal.campaignStats.useQuery({ campaignId: id }, { enabled: !!campaign })
  const stats = statsQuery.data

  const updateMutation = trpc.portal.updateCampaign.useMutation({
    onSuccess: () => {
      utils.portal.campaignById.invalidate({ id })
      utils.portal.myCampaigns.invalidate()
      queryClient.invalidateQueries({ queryKey: portalCampaignKeys.all })
    },
  })

  async function handleSave(data: CreateCampaignFormInput) {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          name: data.name,
          status: data.status,
          // Send `null` (not undefined) so cleared dates/notes actually
          // NULL the columns instead of being skipped by the update.
          startDate: data.startDate ?? null,
          endDate: data.endDate ?? null,
          internalNotes: data.internalNotes ?? null,
        },
      })
      toast.success("Campaign updated")
      setEditing(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update campaign. Please try again.")
    }
  }

  if (campaignQuery.isLoading) {
    return <PortalCampaignDetailSkeleton />
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-semibold">Campaign not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The campaign you are looking for does not exist or you do not have access to it.
        </p>
      </div>
    )
  }

  const statCards = [
    { title: "Clicks", value: formatNumber(stats?.clicks ?? 0) },
    { title: "Conversions", value: formatNumber(stats?.conversions ?? 0) },
    {
      title: "EPC",
      value: formatCurrency(stats?.epc ?? 0),
      tooltip: "Earnings per click — total payout divided by total clicks",
    },
    { title: "Revenue", value: formatCurrency(stats?.revenue ?? 0) },
    { title: "Payout", value: formatCurrency(stats?.payout ?? 0) },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/p/campaigns"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          My Campaigns
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <h1 className="truncate text-2xl font-bold tracking-tight">{campaign.name}</h1>
            <Badge variant={statusVariantMap[campaign.status] ?? "outline"} className="shrink-0 uppercase">
              {campaign.status}
            </Badge>
          </div>
          {canEdit &&
            (editing ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                <IconX data-icon="inline-start" />
                Cancel
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <IconEdit data-icon="inline-start" />
                Edit
              </Button>
            ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ad-accounts">Ad Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {statCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {card.tooltip ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dashed border-muted-foreground/50">
                            {card.title}
                          </span>
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

          {editing ? (
            <CampaignForm
              portal
              funnelId={campaign.funnelId ?? undefined}
              funnelName={campaign.funnel?.name}
              initialData={{
                name: campaign.name,
                funnelId: campaign.funnelId ?? "",
                status: campaign.status,
                startDate: campaign.startDate ? new Date(campaign.startDate) : null,
                endDate: campaign.endDate ? new Date(campaign.endDate) : null,
                internalNotes: campaign.internalNotes ?? "",
              }}
              onSubmit={handleSave}
              isPending={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Funnel</dt>
                    <dd className="mt-1 text-sm font-medium">
                      {campaign.funnel?.name ?? <span className="text-muted-foreground">—</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Product</dt>
                    <dd className="mt-1 flex items-center gap-2">
                      {campaign.product ? (
                        <>
                          {campaign.product.image ? (
                            <img src={campaign.product.image} alt="" className="size-6 rounded object-cover" />
                          ) : (
                            <div className="flex size-6 items-center justify-center rounded bg-muted">
                              <IconPhoto className="size-3.5 text-muted-foreground/50" />
                            </div>
                          )}
                          <span className="truncate text-sm font-medium">{campaign.product.name}</span>
                        </>
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
                        ? formatDate(campaign.startDate, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">End Date</dt>
                    <dd className="mt-1 text-sm">
                      {campaign.endDate
                        ? formatDate(campaign.endDate, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Created</dt>
                    <dd className="mt-1 text-sm">
                      {formatDate(campaign.createdAt, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>

                {campaign.internalNotes && (
                  <div className="mt-4 border-t pt-4">
                    <dt className="text-xs font-medium text-muted-foreground">Internal Notes</dt>
                    <dd className="mt-1 text-sm whitespace-pre-wrap">{campaign.internalNotes}</dd>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ad-accounts" className="flex flex-col gap-6">
          <PortalCampaignAdAccounts campaignId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PortalCampaignDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <Skeleton className="h-10 w-full" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-48" />
    </div>
  )
}
