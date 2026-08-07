"use client"

import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from "@adscrush/ui/components/action-bar"
import { exportTableToCSV } from "@adscrush/shared/lib/export"
import type { Table } from "@tanstack/react-table"
import { CheckCircle2, Download, Trash2, X } from "lucide-react"
import * as React from "react"
import { toast } from "@adscrush/ui/sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"
import {
  type MediaBuyer,
  useBulkDeleteMediaBuyers,
  useBulkUpdateMediaBuyerStatus,
} from "../queries"
import { MEDIA_BUYER_STATUS_VALUES } from "@adscrush/shared/constants/status"

interface MediaBuyersTableActionBarProps {
  table: Table<MediaBuyer>
}

export function MediaBuyersTableActionBar({
  table,
}: MediaBuyersTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows
  const { mutateAsync: bulkUpdateStatus } = useBulkUpdateMediaBuyerStatus()
  const { mutateAsync: bulkDelete } = useBulkDeleteMediaBuyers()

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        table.toggleAllRowsSelected(false)
      }
    },
    [table]
  )

  const onUpdateStatus = React.useCallback(
    async (status: MediaBuyer["status"]) => {
      try {
        await bulkUpdateStatus({
          ids: rows.map((row) => row.original.id),
          status,
        })
        table.toggleAllRowsSelected(false)
        toast.success("Media buyers updated")
      } catch {
        toast.error("Failed to update media buyers")
      }
    },
    [rows, table, bulkUpdateStatus]
  )

  const onExport = React.useCallback(() => {
    exportTableToCSV(table, {
      excludeColumns: ["select", "actions"],
      onlySelected: true,
    })
  }, [table])

  const onDelete = React.useCallback(async () => {
    try {
      await bulkDelete({
        ids: rows.map((row) => row.original.id),
      })
      table.toggleAllRowsSelected(false)
      toast.success("Media buyers deleted")
    } catch {
      toast.error("Failed to delete media buyers")
    }
  }, [rows, table, bulkDelete])

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
            {MEDIA_BUYER_STATUS_VALUES.map((status) => (
              <DropdownMenuItem
                key={status}
                className="capitalize"
                onClick={() => onUpdateStatus(status)}
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ActionBarItem onClick={onExport}>
          <Download />
          Export
        </ActionBarItem>
        <ActionBarItem variant="destructive" onClick={onDelete}>
          <Trash2 />
          Delete
        </ActionBarItem>
      </ActionBarGroup>
    </ActionBar>
  )
}
