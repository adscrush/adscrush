"use client"

import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog"
import type { Department } from "../queries"
import { useDeleteDepartment } from "../queries"

interface DeleteDepartmentDialogProps {
  department: Department | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteDepartmentDialog({
  department,
  open = false,
  onOpenChange,
  onSuccess,
}: DeleteDepartmentDialogProps) {
  const deleteMutation = useDeleteDepartment()

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange ?? (() => {})}
      title="Delete Department"
      description="Are you sure you want to delete this department? This action cannot be undone."
      label="department"
      onDelete={async () => {
        if (!department) return
        await deleteMutation.mutateAsync({ id: department.id })
      }}
      isLoading={deleteMutation.isPending}
      onSuccess={onSuccess}
    >
      {department && (
        <div className="rounded-md bg-muted p-4">
          <p className="font-medium">{department.name}</p>
          {department.description && (
            <p className="text-sm text-muted-foreground">
              {department.description}
            </p>
          )}
        </div>
      )}
    </DeleteConfirmDialog>
  )
}
