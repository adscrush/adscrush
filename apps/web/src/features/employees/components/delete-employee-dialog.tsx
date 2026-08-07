"use client"

import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog"
import type { Employee } from "../queries"
import { useDeleteEmployee } from "../queries"

interface DeleteEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

export function DeleteEmployeeDialog({
  open,
  onOpenChange,
  employee,
}: DeleteEmployeeDialogProps) {
  const deleteMutation = useDeleteEmployee()

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Employee"
      description={
        <>
          Are you sure you want to delete{" "}
          <span className="font-medium">{employee?.name}</span>? This action
          cannot be undone.
        </>
      }
      label="employee"
      onDelete={async () => {
        if (!employee) return
        await deleteMutation.mutateAsync({ id: employee.id })
      }}
      isLoading={deleteMutation.isPending}
    />
  )
}
