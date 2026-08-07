"use client"

import { BulkDeleteConfirmDialog } from "@/components/common/bulk-delete-confirm-dialog"
import type { Product } from "../queries"
import { useBulkDeleteProducts } from "../queries"

interface DeleteProductsDialogProps {
  products: Product[]
  showTrigger?: boolean
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteProductsDialog({
  products,
  showTrigger = true,
  onSuccess,
  open = false,
  onOpenChange,
}: DeleteProductsDialogProps) {
  const bulkDeleteMutation = useBulkDeleteProducts()

  return (
    <BulkDeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange ?? (() => {})}
      items={products}
      entityLabel="Product"
      onDelete={async (ids) => {
        await bulkDeleteMutation.mutateAsync({ ids })
      }}
      isLoading={bulkDeleteMutation.isPending}
      showTrigger={showTrigger}
      onSuccess={onSuccess}
    />
  )
}
