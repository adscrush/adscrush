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
import type { AdAccount } from "../queries"
import { toast } from "@adscrush/ui/sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"
import { useBulkUpdateAdAccountStatus } from "../queries"
import { AD_ACCOUNT_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { User } from "lucide-react"
import { BulkUpdateMediaBuyerDialog } from "./bulk-update-media-buyer-dialog"
import { BulkDeleteAdAccountsDialog } from "./bulk-delete-ad-accounts-dialog"

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  risk_control: "Risk Control",
  disconnected: "Disconnected",
  disabled: "Disabled",
  not_in_use: "Not In Use",
}

interface AdAccountsTableActionBarProps {
  table: Table<AdAccount>
}

export function AdAccountsTableActionBar({
  table,
}: AdAccountsTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows
  const { mutateAsync: bulkUpdateStatus } = useBulkUpdateAdAccountStatus()
  const [bulkMediaBuyerOpen, setBulkMediaBuyerOpen] = React.useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false)

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        table.toggleAllRowsSelected(false)
      }
    },
    [table]
  )

  const onUpdateStatus = React.useCallback(
    async (status: AdAccount["status"]) => {
      try {
        await bulkUpdateStatus({
          ids: rows.map((row) => row.original.id),
          status,
        })
        table.toggleAllRowsSelected(false)
        toast.success("Ad accounts updated")
      } catch {
        toast.error("Failed to update ad accounts")
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
            {AD_ACCOUNT_STATUS_VALUES.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => onUpdateStatus(status)}
              >
                {STATUS_LABELS[status] ?? status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ActionBarItem onClick={(e) => { e.preventDefault(); setBulkMediaBuyerOpen(true) }}>
          <User />
          Media Buyer
        </ActionBarItem>
        <ActionBarItem onClick={onExport}>
          <Download />
          Export
        </ActionBarItem>
        <ActionBarItem
          variant="destructive"
          onClick={(e) => {
            e.preventDefault()
            setBulkDeleteOpen(true)
          }}
        >
          <Trash2 />
          Delete
        </ActionBarItem>
      </ActionBarGroup>

      <BulkUpdateMediaBuyerDialog
        open={bulkMediaBuyerOpen}
        onOpenChange={setBulkMediaBuyerOpen}
        table={table}
      />

      <BulkDeleteAdAccountsDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        table={table}
      />
    </ActionBar>
  )
}
