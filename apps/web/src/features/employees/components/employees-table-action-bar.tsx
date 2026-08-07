"use client"

import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from "@adscrush/ui/components/action-bar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"
import { toast } from "@adscrush/ui/sonner"
import type { Table } from "@tanstack/react-table"
import { CheckCircle2, Trash2, X } from "lucide-react"
import * as React from "react"
import { type Employee, useBulkDeleteEmployees, useBulkUpdateEmployeeStatus } from "../queries"
import { EMPLOYEE_STATUS, type EmployeeStatus } from "@adscrush/shared/constants/status"

interface EmployeesTableActionBarProps {
  table: Table<Employee>
}

export function EmployeesTableActionBar({ table }: EmployeesTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows
  const { mutateAsync: bulkUpdateStatus } = useBulkUpdateEmployeeStatus()
  const { mutateAsync: bulkDeleteEmployees } = useBulkDeleteEmployees()

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        table.toggleAllRowsSelected(false)
      }
    },
    [table]
  )

  const onUpdateStatus = React.useCallback(
    async (status: EmployeeStatus) => {
      try {
        await bulkUpdateStatus({
          ids: rows.map((row) => row.original.id),
          status,
        })
        table.toggleAllRowsSelected(false)
        toast.success("Employees updated")
      } catch {
        toast.error("Failed to update employees")
      }
    },
    [rows, table, bulkUpdateStatus]
  )

  const onDelete = React.useCallback(async () => {
    try {
      await bulkDeleteEmployees({ ids: rows.map((row) => row.original.id) })
      table.toggleAllRowsSelected(false)
      toast.success("Employees deleted")
    } catch {
      toast.error("Failed to delete employees")
    }
  }, [rows, table, bulkDeleteEmployees])

  return (
    <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
      <ActionBarSelection>
        <span className="font-medium">{rows.length}</span>
        <span>selected</span>
        <ActionBarSeparator />
        <ActionBarClose asChild>
          <X className="size-4 cursor-pointer" />
        </ActionBarClose>
      </ActionBarSelection>
      <ActionBarSeparator />
      <ActionBarGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ActionBarItem>
              <CheckCircle2 />
              Status
            </ActionBarItem>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {Object.entries(EMPLOYEE_STATUS).map(([key, value]) => (
              <DropdownMenuItem key={key} className="capitalize" onClick={() => onUpdateStatus(value)}>
                {value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ActionBarItem variant="destructive" onClick={onDelete}>
          <Trash2 />
          Delete
        </ActionBarItem>
      </ActionBarGroup>
    </ActionBar>
  )
}
