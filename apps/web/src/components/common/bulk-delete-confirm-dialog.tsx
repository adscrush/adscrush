"use client"

import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adscrush/ui/components/dialog"
import { toast } from "@adscrush/ui/sonner"
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react"
import { Trash } from "lucide-react"

interface BulkDeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: { id: string; name?: string }[]
  /** Entity label used in title, description and toasts (e.g. "Advertiser", "Media Buyer") */
  entityLabel: string
  /** Callback with the IDs to delete */
  onDelete: (ids: string[]) => Promise<unknown>
  isLoading: boolean
  showTrigger?: boolean
  onSuccess?: () => void
}

export function BulkDeleteConfirmDialog({
  open,
  onOpenChange,
  items,
  entityLabel,
  onDelete,
  isLoading,
  showTrigger = true,
  onSuccess,
}: BulkDeleteConfirmDialogProps) {
  const handleDelete = async () => {
    try {
      await onDelete(items.map((item) => item.id))
      const label = entityLabel.toLowerCase()
      const count = items.length
      toast.success(
        count === 1 ? `${entityLabel} deleted` : `${count} ${label}s deleted`
      )
      onSuccess?.()
      onOpenChange(false)
    } catch (error: unknown) {
      const label = entityLabel.toLowerCase()
      toast.error(
        error instanceof Error ? error.message : `Failed to delete ${label}`
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger
          render={
            <Button
              aria-label="Delete selected"
              variant="outline"
              size="sm"
              className="h-8"
            >
              <Trash className="mr-2 size-4" aria-hidden="true" />
              Delete
            </Button>
          }
        ></DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconAlertTriangle className="size-5 text-destructive" />
            Are you absolutely sure?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            {items.length === 1 ? (
              <>
                <strong>{items[0]?.name}</strong> {entityLabel.toLowerCase()}
              </>
            ) : (
              <>
                your{" "}
                <span className="font-medium">{items.length}</span>{" "}
                {entityLabel.toLowerCase()}s
              </>
            )}{" "}
            from our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
          <span className="font-medium text-destructive">Warning:</span> Some of
          these items may be referenced by other resources.
        </div>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            aria-label="Delete selected rows"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && (
              <IconLoader2
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
