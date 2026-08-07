"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@adscrush/ui/components/alert-dialog"
import { Button } from "@adscrush/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@adscrush/ui/components/tooltip"
import { toast } from "@adscrush/ui/sonner"
import { IconAlertTriangle, IconLoader2, IconTrash } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useDeleteCampaign } from "../queries"

interface DeleteCampaignDialogProps {
  campaignId: string
  campaignName: string
  campaignStatus: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** When false, renders the dialog without its trigger button (e.g. opened from a row action menu). */
  showTrigger?: boolean
}

export function DeleteCampaignDialog({
  campaignId,
  campaignName,
  campaignStatus,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: DeleteCampaignDialogProps) {
  const router = useRouter()
  const deleteMutation = useDeleteCampaign()
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen

  const isActive = campaignStatus === "active"
  const isDeleting = deleteMutation.isPending

  const handleConfirmDelete = () => {
    deleteMutation.mutate(
      { id: campaignId },
      {
        onSuccess: () => {
          onOpenChange?.(false)
          toast.success(`Campaign "${campaignName}" has been deleted.`, {
            duration: 5000,
          })
          router.push("/campaigns")
        },
        onError: (error) => {
          onOpenChange?.(false)
          toast.error(
            error.message || "Failed to delete campaign. Please try again.",
            { duration: 5000 }
          )
        },
      }
    )
  }

  // If campaign is active, show disabled button with tooltip (standalone trigger usage only)
  if (isActive) {
    if (!showTrigger) return null
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button variant="destructive" size="sm" disabled>
              <IconTrash className="mr-2 size-4" />
              Delete
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Active campaigns cannot be deleted. Change the status first.
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <IconTrash className="mr-2 size-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <IconAlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              &ldquo;{campaignName}&rdquo;
            </span>
            ? This action is irreversible and all associated data will be
            permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Campaign"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
