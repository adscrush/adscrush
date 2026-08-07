"use client"

import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog"
import type { Category } from "../queries"
import { useDeleteCategory } from "../queries"

interface DeleteCategoryDialogProps {
  category: Category | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteCategoryDialog({
  category,
  open = false,
  onOpenChange,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const deleteMutation = useDeleteCategory()

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange ?? (() => {})}
      title="Delete Category"
      description="Are you sure you want to delete this category? This action cannot be undone."
      label="category"
      onDelete={async () => {
        if (!category) return
        await deleteMutation.mutateAsync({ id: category.id })
      }}
      isLoading={deleteMutation.isPending}
      onSuccess={onSuccess}
    >
      {category && (
        <div className="rounded-md bg-muted p-4">
          <p className="font-medium">{category.name}</p>
          {category.description && (
            <p className="text-sm text-muted-foreground">
              {category.description}
            </p>
          )}
        </div>
      )}
    </DeleteConfirmDialog>
  )
}
