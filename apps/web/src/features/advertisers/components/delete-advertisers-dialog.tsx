"use client"

import { BulkDeleteConfirmDialog } from "@/components/common/bulk-delete-confirm-dialog"
import type { Advertiser } from "../queries"
import { useBulkDeleteAdvertisers } from "../queries"

interface DeleteAdvertisersDialogProps {
  advertisers: Advertiser[]
  showTrigger?: boolean
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteAdvertisersDialog({
  advertisers,
  showTrigger = true,
  onSuccess,
  open = false,
  onOpenChange,
}: DeleteAdvertisersDialogProps) {
  const bulkDeleteMutation = useBulkDeleteAdvertisers()

  return (
    <BulkDeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange ?? (() => {})}
      items={advertisers}
      entityLabel="Advertiser"
      onDelete={async (ids) => {
        await bulkDeleteMutation.mutateAsync({ ids })
      }}
      isLoading={bulkDeleteMutation.isPending}
      showTrigger={showTrigger}
      onSuccess={onSuccess}
    />
  )
}
