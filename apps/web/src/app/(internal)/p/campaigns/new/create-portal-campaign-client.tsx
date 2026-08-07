"use client"

import * as React from "react"
import { CampaignForm } from "@/features/campaigns/components/campaign-form"
import { PortalCampaignAdAccounts } from "@/features/portal/components/portal-campaign-ad-accounts"
import { portalCampaignKeys } from "@/features/portal/queries/campaigns"
import type { CreateCampaignFormInput } from "@/features/campaigns/validations"
import { useRouter } from "next/navigation"
import { toast } from "@adscrush/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adscrush/ui/components/tabs"
import { Button } from "@adscrush/ui/components/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@adscrush/ui/components/alert-dialog"
import { IconAlertTriangle, IconArrowRight, IconCircleCheck } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc/client"

type CreateTab = "general" | "ad-accounts"

/** The campaign created in the General step, once it exists. */
interface CreatedCampaign {
  id: string
}

/**
 * Media buyer portal create-campaign flow.
 *
 * Step 1 (General) creates the campaign from a funnel linked to one of the
 * buyer's assigned products. Step 2 (Ad Accounts) links the buyer's own ad
 * accounts so the campaign has tracking links. Owned campaigns appear in
 * "My Campaigns" immediately, even before any account is assigned.
 */
export function CreatePortalCampaignClient() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()
  const createCampaign = trpc.portal.createCampaign.useMutation()

  const [activeTab, setActiveTab] = React.useState<CreateTab>("general")
  const [created, setCreated] = React.useState<CreatedCampaign | null>(null)
  const [confirmFinishOpen, setConfirmFinishOpen] = React.useState(false)

  // Track assigned accounts so we can warn before finishing with none linked
  const { data: campaignAccounts } = trpc.portal.campaignAdAccounts.useQuery(
    { campaignId: created?.id ?? "" },
    { enabled: !!created }
  )
  const assignedCount = (campaignAccounts ?? []).filter((a) => a.isAssigned).length

  async function handleSubmit(data: CreateCampaignFormInput) {
    try {
      const campaign = await createCampaign.mutateAsync({
        name: data.name,
        funnelId: data.funnelId,
        status: data.status,
        startDate: data.startDate ?? undefined,
        endDate: data.endDate ?? undefined,
        internalNotes: data.internalNotes ?? undefined,
      })

      setCreated({ id: campaign.id })
      setActiveTab("ad-accounts")
      toast.success("Campaign created — now assign ad accounts")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create campaign. Please try again.")
    }
  }

  function handleFinishClick() {
    if (assignedCount === 0) {
      setConfirmFinishOpen(true)
      return
    }
    void handleFinish()
  }

  async function handleFinish() {
    await Promise.all([
      utils.portal.myCampaigns.invalidate(),
      queryClient.invalidateQueries({ queryKey: portalCampaignKeys.all }),
    ])
    router.push("/p/campaigns")
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CreateTab)} className="w-full space-y-6">
      <TabsList variant="line" className="w-fit justify-start">
        <TabsTrigger value="general" className="flex-none px-3">
          <span className="mr-1.5 font-mono text-xs text-muted-foreground">1</span>
          General
        </TabsTrigger>
        <TabsTrigger value="ad-accounts" className="flex-none px-3" disabled={!created}>
          <span className="mr-1.5 font-mono text-xs text-muted-foreground">2</span>
          Ad Accounts
        </TabsTrigger>
      </TabsList>

      {/* Step 1 — General. forceMount keeps the form (and its state) alive
          when switching to the Ad Accounts tab. */}
      <TabsContent value="general" forceMount className="data-[state=inactive]:hidden">
        <CampaignForm
          portal
          onSubmit={handleSubmit}
          isPending={createCampaign.isPending}
          submitLabel="Create Campaign"
        />
      </TabsContent>

      {/* Step 2 — Ad Accounts */}
      <TabsContent value="ad-accounts" className="space-y-6">
        {created ? (
          <>
            <PortalCampaignAdAccounts campaignId={created.id} />
            <div className="flex items-center justify-between border-t pt-6">
              <Button variant="ghost" type="button" onClick={() => setActiveTab("general")}>
                Back to details
              </Button>
              <Button type="button" className="gap-2" onClick={handleFinishClick}>
                <IconCircleCheck className="size-4" />
                Finish
                <IconArrowRight className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Create the campaign first to assign ad accounts.</p>
        )}
      </TabsContent>

      {/* Warning when finishing without any assigned ad accounts */}
      <AlertDialog open={confirmFinishOpen} onOpenChange={setConfirmFinishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="size-4 text-amber-500" />
              No ad accounts assigned
            </AlertDialogTitle>
            <AlertDialogDescription>
              You haven&apos;t linked any ad accounts to this campaign yet. It will still appear in &quot;My Campaigns&quot;, but no
              tracking links will be generated until you assign one. Continue anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Assign accounts</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleFinish()}>Finish anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}
