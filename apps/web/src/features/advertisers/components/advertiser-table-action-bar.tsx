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
  type Advertiser,
  useBulkDeleteAdvertisers,
  useBulkUpdateAdvertiserStatus,
} from "../queries"
import { ADVERTISER_STATUS_VALUES } from "@adscrush/shared/constants/status"

interface AdvertisersTableActionBarProps {
  table: Table<Advertiser>
}

export function AdvertisersTableActionBar({
  table,
}: AdvertisersTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows
  const { mutateAsync: bulkUpdateStatus } = useBulkUpdateAdvertiserStatus()
  const { mutateAsync: bulkDelete } = useBulkDeleteAdvertisers()

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        table.toggleAllRowsSelected(false)
      }
    },
    [table]
  )

  const onUpdateStatus = React.useCallback(
    async (status: Advertiser["status"]) => {
      try {
        await bulkUpdateStatus({
          ids: rows.map((row) => row.original.id),
          status,
        })
        table.toggleAllRowsSelected(false)
        toast.success("Advertisers updated")
      } catch {
        toast.error("Failed to update advertisers")
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
      toast.success("Advertisers deleted")
    } catch {
      toast.error("Failed to delete advertisers")
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
            {ADVERTISER_STATUS_VALUES.map((status) => (
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
