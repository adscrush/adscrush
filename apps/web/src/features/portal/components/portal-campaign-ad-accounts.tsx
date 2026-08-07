"use client"

import * as React from "react"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@adscrush/ui/components/button"
import { Badge } from "@adscrush/ui/components/badge"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@adscrush/ui/components/tooltip"
import { toast } from "@adscrush/ui/sonner"
import { IconCheck, IconCopy, IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react"
import { cn } from "@adscrush/ui/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { portalCampaignKeys } from "../queries/campaigns"

interface PortalCampaignAdAccountsProps {
  campaignId: string
}

const platformColors: Record<string, string> = {
  facebook: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  google: "bg-red-500/15 text-red-400 border-red-500/20",
  tiktok: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  taboola: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  outbrain: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  native: "bg-purple-500/15 text-purple-400 border-purple-500/20",
}

/**
 * Ad-account assignment step of the portal create-campaign flow.
 * Lists the media buyer's own ad accounts with assign / unassign toggles and
 * per-account tracking links.
 */
export function PortalCampaignAdAccounts({ campaignId }: PortalCampaignAdAccountsProps) {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const { data, isLoading } = trpc.portal.campaignAdAccounts.useQuery({
    campaignId,
  })
  const accounts = data ?? []

  const refreshCampaign = () => {
    utils.portal.campaignAdAccounts.invalidate({ campaignId })
    utils.portal.myCampaigns.invalidate()
    queryClient.invalidateQueries({ queryKey: portalCampaignKeys.all })
  }

  const assignMutation = trpc.portal.assignAdAccount.useMutation({
    onSuccess: refreshCampaign,
  })
  const removeMutation = trpc.portal.removeAdAccount.useMutation({
    onSuccess: refreshCampaign,
  })

  const handleCopy = async (trackingLink: string, id: string) => {
    try {
      await navigator.clipboard.writeText(trackingLink)
      setCopiedId(id)
      toast.success("Tracking link copied to clipboard", { duration: 3000 })
      setTimeout(() => setCopiedId(null), 3000)
    } catch {
      toast.error("Failed to copy tracking link")
    }
  }

  const isBusy = assignMutation.isPending || removeMutation.isPending

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">Assign ad accounts</p>
        <p className="text-xs text-muted-foreground">
          Link your ad accounts to generate tracking links for this campaign.
        </p>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-14 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">No ad accounts available</p>
          <p className="text-xs text-muted-foreground/70">
            Contact your account manager to link ad accounts to your profile.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={cn("flex items-center gap-3 px-4 py-3 transition-colors", account.isAssigned && "bg-muted/15")}
            >
              {/* Account info */}
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 border px-1.5 py-0 text-[9px] font-semibold uppercase",
                    platformColors[account.platform.toLowerCase()] ?? "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {account.platform}
                </Badge>
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate text-[13px] font-medium">{account.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{account.accountId}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-0.5">
                {account.isAssigned ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-7"
                          onClick={() => handleCopy(account.trackingLink!, account.id)}
                          aria-label="Copy tracking link"
                        >
                          {copiedId === account.id ? (
                            <IconCheck className="size-3.5 text-green-500" />
                          ) : (
                            <IconCopy className="size-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy tracking link</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-7 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            removeMutation.mutate(
                              { campaignId, adAccountId: account.id },
                              {
                                onError: (error) => toast.error(error.message || "Failed to remove ad account"),
                              }
                            )
                          }
                          disabled={isBusy}
                          aria-label={`Remove ${account.name}`}
                        >
                          <IconTrash className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove from campaign</TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={() =>
                      assignMutation.mutate(
                        { campaignId, adAccountId: account.id },
                        {
                          onSuccess: () => toast.success("Ad account assigned to campaign"),
                          onError: (error) => toast.error(error.message || "Failed to assign ad account"),
                        }
                      )
                    }
                    disabled={isBusy}
                  >
                    {assignMutation.isPending ? (
                      <IconLoader2 className="mr-1 size-3 animate-spin" />
                    ) : (
                      <IconPlus className="mr-1 size-3" />
                    )}
                    Assign
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
