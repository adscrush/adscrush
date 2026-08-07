"use client"

import { BulkDeleteConfirmDialog } from "@/components/common/bulk-delete-confirm-dialog"
import type { AdAccount } from "../queries"
import { useDeleteAdAccount } from "../queries"

interface DeleteAdAccountsDialogProps {
  adAccount: AdAccount | null
  showTrigger?: boolean
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteAdAccountsDialog({
  adAccount,
  showTrigger = true,
  onSuccess,
  open = false,
  onOpenChange,
}: DeleteAdAccountsDialogProps) {
  const deleteMutation = useDeleteAdAccount()

  return (
    <BulkDeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange ?? (() => {})}
      items={adAccount ? [adAccount] : []}
      entityLabel="Ad Account"
      onDelete={async (ids) => {
        if (ids[0]) {
          await deleteMutation.mutateAsync({ id: ids[0] })
        }
      }}
      isLoading={deleteMutation.isPending}
      showTrigger={showTrigger}
      onSuccess={onSuccess}
    />
  )
}
