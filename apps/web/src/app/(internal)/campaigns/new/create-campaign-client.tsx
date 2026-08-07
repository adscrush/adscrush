"use client"

import * as React from "react"
import { CampaignForm } from "@/features/campaigns/components/campaign-form"
import { CampaignAdAccountsTab } from "@/features/campaigns/components/campaign-ad-accounts-tab"
import {
  useCreateCampaign,
  useSyncCreatives,
  useUpdateCampaign,
} from "@/features/campaigns/queries"
import type { CreateCampaignFormInput } from "@/features/campaigns/validations"
import { useRouter } from "next/navigation"
import { toast } from "@adscrush/ui/sonner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@adscrush/ui/components/tabs"
import { Button } from "@adscrush/ui/components/button"
import { IconArrowRight, IconCircleCheck } from "@tabler/icons-react"

interface CreateCampaignClientProps {
  /** Pre-populated funnel ID (from-funnel flow) */
  funnelId?: string
  /** Display name for the pre-populated funnel */
  funnelName?: string
}

type CreateTab = "general" | "ad-accounts"

/** The campaign created in the General step, once it exists. */
interface CreatedCampaign {
  id: string
  funnelId: string
}

export function CreateCampaignClient({
  funnelId,
  funnelName,
}: CreateCampaignClientProps) {
  const router = useRouter()
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()
  const syncCreatives = useSyncCreatives()

  const [activeTab, setActiveTab] = React.useState<CreateTab>("general")
  const [created, setCreated] = React.useState<CreatedCampaign | null>(null)

  const isPending =
    createCampaign.isPending ||
    updateCampaign.isPending ||
    syncCreatives.isPending

  async function handleSubmit(data: CreateCampaignFormInput) {
    // Re-submitting the General tab after creation updates the campaign
    // (and re-syncs creatives) instead of creating a duplicate.
    if (created) {
      try {
        await updateCampaign.mutateAsync({
          id: created.id,
          data: {
            name: data.name,
            status: data.status,
            startDate: data.startDate ?? undefined,
            endDate: data.endDate ?? undefined,
            internalNotes: data.internalNotes ?? undefined,
          },
        })
        await syncCreatives.mutateAsync({
          campaignId: created.id,
          creativeIds: data.creativeIds ?? [],
        })

        setActiveTab("ad-accounts")
        toast.success("Campaign details saved")
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to save campaign. Please try again."
        )
      }
      return
    }

    try {
      const campaign = await createCampaign.mutateAsync({
        name: data.name,
        funnelId: data.funnelId,
        status: data.status,
        startDate: data.startDate ?? undefined,
        endDate: data.endDate ?? undefined,
        internalNotes: data.internalNotes ?? undefined,
      })

      // Link the selected creatives to the freshly created campaign.
      if (data.creativeIds && data.creativeIds.length > 0) {
        await syncCreatives.mutateAsync({
          campaignId: campaign.id,
          creativeIds: data.creativeIds,
        })
      }

      setCreated({
        id: campaign.id,
        funnelId: campaign.funnelId ?? data.funnelId,
      })
      setActiveTab("ad-accounts")
      toast.success("Campaign created — now assign ad accounts")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create campaign. Please try again."
      )
    }
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as CreateTab)}
      className="w-full space-y-6"
    >
      <TabsList variant="line" className="w-fit justify-start">
        <TabsTrigger value="general" className="flex-none px-3">
          <span className="mr-1.5 font-mono text-xs text-muted-foreground">
            1
          </span>
          General
        </TabsTrigger>
        <TabsTrigger
          value="ad-accounts"
          className="flex-none px-3"
          disabled={!created}
        >
          <span className="mr-1.5 font-mono text-xs text-muted-foreground">
            2
          </span>
          Ad Accounts
        </TabsTrigger>
      </TabsList>

      {/* Step 1 — General. forceMount keeps the form (and its state) alive
          when switching to the Ad Accounts tab, so returning here preserves
          everything the user entered. */}
      <TabsContent value="general" forceMount className="data-[state=inactive]:hidden">
        <CampaignForm
          funnelId={funnelId}
          funnelName={funnelName}
          onSubmit={handleSubmit}
          isPending={isPending}
          submitLabel={created ? "Save & Continue" : "Create Campaign"}
        />
      </TabsContent>

      {/* Step 2 — Ad Accounts */}
      <TabsContent value="ad-accounts" className="space-y-6">
        {created ? (
          <>
            <CampaignAdAccountsTab
              campaignId={created.id}
              funnelId={created.funnelId}
            />
            <div className="flex items-center justify-between border-t pt-6">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setActiveTab("general")}
              >
                Back to details
              </Button>
              <Button
                type="button"
                className="gap-2"
                onClick={() => router.push(`/campaigns/${created.id}`)}
              >
                <IconCircleCheck className="size-4" />
                Finish
                <IconArrowRight className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Create the campaign first to assign ad accounts.
          </p>
        )}
      </TabsContent>
    </Tabs>
  )
}
