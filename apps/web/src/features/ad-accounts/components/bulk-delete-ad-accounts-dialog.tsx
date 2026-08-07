"use client"

import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@adscrush/ui/components/dialog"
import { toast } from "@adscrush/ui/sonner"
import type { Table } from "@tanstack/react-table"
import { Loader } from "lucide-react"
import type { AdAccount } from "../queries"
import { useBulkDeleteAdAccounts } from "../queries"

interface BulkDeleteAdAccountsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<AdAccount>
}

export function BulkDeleteAdAccountsDialog({
  open,
  onOpenChange,
  table,
}: BulkDeleteAdAccountsDialogProps) {
  const deleteMutation = useBulkDeleteAdAccounts()

  const rows = table.getFilteredSelectedRowModel().rows

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        ids: rows.map((row) => row.original.id),
      })
      table.toggleAllRowsSelected(false)
      onOpenChange(false)
      toast.success("Ad accounts deleted")
    } catch {
      toast.error("Failed to delete ad accounts")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-medium">{rows.length}</span> ad account
            {rows.length === 1 ? "" : "s"} from our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
          <span className="font-medium text-destructive">Warning:</span> All
          spend history and campaign links for these ad accounts will also be
          permanently deleted.
        </div>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            aria-label="Delete selected ad accounts"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
