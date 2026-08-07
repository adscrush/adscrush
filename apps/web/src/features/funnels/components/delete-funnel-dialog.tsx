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
} from "@adscrush/ui/components/alert-dialog"
import { toast } from "@adscrush/ui/sonner"
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react"
import * as React from "react"
import { useDeleteFunnel } from "../queries"

interface DeleteFunnelDialogProps {
  funnelId: string | null
  funnelName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Controlled confirmation dialog for deleting a single funnel from the list.
 * Driven by the row action state in {@link FunnelsDataTable}; pass a `null`
 * id and `open: false` to hide it.
 */
export function DeleteFunnelDialog({
  funnelId,
  funnelName,
  open,
  onOpenChange,
}: DeleteFunnelDialogProps) {
  const deleteMutation = useDeleteFunnel()
  const isDeleting = deleteMutation.isPending

  const handleConfirmDelete = () => {
    if (!funnelId) return
    deleteMutation.mutate(
      { id: funnelId },
      {
        onSuccess: () => {
          onOpenChange(false)
          toast.success(`Funnel "${funnelName}" has been deleted.`, {
            duration: 5000,
          })
        },
        onError: (error) => {
          onOpenChange(false)
          toast.error(
            error.message || "Failed to delete funnel. Please try again.",
            { duration: 5000 }
          )
        },
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <IconAlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Funnel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              &ldquo;{funnelName}&rdquo;
            </span>
            ? This action is irreversible and all associated landing pages will
            be permanently removed.
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
              "Delete Funnel"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
