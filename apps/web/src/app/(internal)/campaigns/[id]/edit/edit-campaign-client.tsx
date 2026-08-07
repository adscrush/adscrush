"use client"

import { CampaignForm } from "@/features/campaigns/components/campaign-form"
import { useCampaign, useUpdateCampaign } from "@/features/campaigns/queries"
import type { CreateCampaignFormInput } from "@/features/campaigns/validations"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Card, CardContent, CardHeader } from "@adscrush/ui/components/card"
import { toast } from "@adscrush/ui/sonner"
import { useRouter } from "next/navigation"

interface EditCampaignClientProps {
  id: string
  funnelName?: string
}

export function EditCampaignClient({ id, funnelName }: EditCampaignClientProps) {
  const router = useRouter()
  const { data: result, isLoading } = useCampaign(id)
  const updateCampaign = useUpdateCampaign()

  const campaign = result?.data

  async function handleSubmit(data: CreateCampaignFormInput) {
    try {
      await updateCampaign.mutateAsync({
        id,
        data: {
          name: data.name,
          funnelId: data.funnelId,
          status: data.status,
          startDate: data.startDate ?? undefined,
          endDate: data.endDate ?? undefined,
          internalNotes: data.internalNotes ?? undefined,
        },
      })

      toast.success("Campaign updated successfully")
      router.push(`/campaigns/${id}`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update campaign. Please try again."
      )
    }
  }

  if (isLoading) {
    return <EditCampaignSkeleton />
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-semibold">Campaign not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The campaign you are trying to edit does not exist or you do not have access to it.
        </p>
      </div>
    )
  }

  return (
    <CampaignForm
      funnelId={campaign.funnelId ?? undefined}
      funnelName={funnelName ?? campaign.funnel?.name}
      initialData={{
        name: campaign.name,
        funnelId: campaign.funnelId ?? "",
        status: campaign.status,
        startDate: campaign.startDate ? new Date(campaign.startDate) : null,
        endDate: campaign.endDate ? new Date(campaign.endDate) : null,
        internalNotes: campaign.internalNotes ?? "",
      }}
      onSubmit={handleSubmit}
      isPending={updateCampaign.isPending}
      submitLabel="Save Changes"
    />
  )
}

function EditCampaignSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
