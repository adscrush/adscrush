"use client"

import { useHasPermission } from "@/hooks/use-permission"
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
import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@adscrush/ui/components/empty"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@adscrush/ui/components/tooltip"
import { toast } from "@adscrush/ui/sonner"
import {
  IconCheck,
  IconCopy,
  IconLink,
  IconLoader2,
  IconTrash,
} from "@tabler/icons-react"
import * as React from "react"
import { useRemoveAdAccount } from "../queries"
import { AssignAdAccountDialog } from "./assign-ad-account-dialog"
import { TrackingLinksBuilderDialog } from "./tracking-links-builder-dialog"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CampaignAdAccountAssignment {
  id: string
  adAccountId: string
  adAccount: {
    name: string
    platform: string
  }
  trackingLink: string
}

interface CampaignAdAccountsListProps {
  campaignId: string
  adAccounts: CampaignAdAccountAssignment[]
  funnelId?: string | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CampaignAdAccountsList({
  campaignId,
  adAccounts,
  funnelId,
}: CampaignAdAccountsListProps) {
  const canEdit = useHasPermission("campaigns.edit")
  const removeAdAccount = useRemoveAdAccount()

  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = React.useState<CampaignAdAccountAssignment | null>(null)

  const handleCopy = async (trackingLink: string, assignmentId: string) => {
    try {
      await navigator.clipboard.writeText(trackingLink)
      setCopiedId(assignmentId)
      toast.success("Tracking link copied to clipboard", { duration: 3000 })
      setTimeout(() => setCopiedId(null), 3000)
    } catch {
      toast.error("Failed to copy tracking link")
    }
  }

  const handleRemoveConfirm = () => {
    if (!removeTarget) return

    removeAdAccount.mutate(
      { campaignId, adAccountId: removeTarget.adAccountId },
      {
        onSuccess: () => {
          toast.success("Ad account removed from campaign")
          setRemoveTarget(null)
        },
        onError: (error) => {
          toast.error(error.message || "Failed to remove ad account")
          setRemoveTarget(null)
        },
      }
    )
  }

  if (adAccounts.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconLink />
          </EmptyMedia>
          <EmptyTitle>No ad accounts assigned</EmptyTitle>
          <EmptyDescription>
            Assign an ad account to this campaign to generate its tracking links.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <AssignAdAccountDialog campaignId={campaignId} assignedAdAccountIds={[]} />
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned Ad Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {adAccounts.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {assignment.adAccount.name}
                </span>
                <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                  {assignment.adAccount.platform}
                </Badge>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <TrackingLinksBuilderDialog
                  campaignId={campaignId}
                  adAccountId={assignment.adAccountId}
                  adAccountName={assignment.adAccount.name}
                  adAccountPlatform={assignment.adAccount.platform}
                  baseTrackingLink={assignment.trackingLink}
                  funnelId={funnelId}
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-8"
                      onClick={() => handleCopy(assignment.trackingLink, assignment.id)}
                      aria-label="Copy default tracking link"
                    >
                      {copiedId === assignment.id ? (
                        <IconCheck className="size-4 text-green-600" />
                      ) : (
                        <IconCopy className="size-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy default link</TooltipContent>
                </Tooltip>

                {canEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setRemoveTarget(assignment)}
                        aria-label={`Remove ${assignment.adAccount.name}`}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove from campaign</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Remove confirmation dialog */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Ad Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">{removeTarget?.adAccount.name}</span> from
              this campaign? The tracking link will no longer be active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeAdAccount.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={removeAdAccount.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeAdAccount.isPending ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
