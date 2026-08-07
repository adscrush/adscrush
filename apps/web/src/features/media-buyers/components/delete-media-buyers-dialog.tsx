"use client"

import { BulkDeleteConfirmDialog } from "@/components/common/bulk-delete-confirm-dialog"
import type { MediaBuyer } from "../queries"
import { useBulkDeleteMediaBuyers } from "../queries"

interface DeleteMediaBuyersDialogProps {
  mediaBuyers: MediaBuyer[]
  showTrigger?: boolean
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteMediaBuyersDialog({
  mediaBuyers,
  showTrigger = true,
  onSuccess,
  open = false,
  onOpenChange,
}: DeleteMediaBuyersDialogProps) {
  const bulkDeleteMutation = useBulkDeleteMediaBuyers()

  return (
    <BulkDeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange ?? (() => {})}
      items={mediaBuyers}
      entityLabel="Media Buyer"
      onDelete={async (ids) => {
        await bulkDeleteMutation.mutateAsync({ ids })
      }}
      isLoading={bulkDeleteMutation.isPending}
      showTrigger={showTrigger}
      onSuccess={onSuccess}
    />
  )
}
