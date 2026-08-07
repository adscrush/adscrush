"use client"

import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@adscrush/ui/components/dialog"
import { toast } from "@adscrush/ui/sonner"
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react"
import type { ReactNode } from "react"

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => Promise<unknown>
  isLoading: boolean
  title: string
  description: string | ReactNode
  /** Optional detail content shown between description and footer (e.g. entity details) */
  children?: ReactNode
  onSuccess?: () => void
  /** Entity label used in success/error toasts. Defaults to lowercase title. */
  label?: string
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onDelete,
  isLoading,
  title,
  description,
  children,
  onSuccess,
  label,
}: DeleteConfirmDialogProps) {
  const entityLabel = label ?? title.replace(/^Delete\s+/i, "").toLowerCase()

  const handleDelete = async () => {
    try {
      await onDelete()
      toast.success(`${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} deleted`)
      onSuccess?.()
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : `Failed to delete ${entityLabel}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconAlertTriangle className="size-5 text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
