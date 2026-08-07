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
import { Field, FieldContent, FieldError, FieldLabel } from "@adscrush/ui/components/field"
import { toast } from "@adscrush/ui/sonner"
import { IconLoader2 } from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"
import * as React from "react"
import type { AdAccount } from "../queries"
import { useBulkUpdateAdAccountMediaBuyer } from "../queries"
import { MediaBuyerCombobox } from "./media-buyer-combobox"

interface BulkUpdateMediaBuyerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<AdAccount>
}

export function BulkUpdateMediaBuyerDialog({
  open,
  onOpenChange,
  table,
}: BulkUpdateMediaBuyerDialogProps) {
  const [mediaBuyerId, setMediaBuyerId] = React.useState<string | null>(null)
  const [error, setError] = React.useState(false)
  const updateMutation = useBulkUpdateAdAccountMediaBuyer()

  React.useEffect(() => {
    if (open) {
      setMediaBuyerId(null)
      setError(false)
    }
  }, [open])

  const rows = table.getFilteredSelectedRowModel().rows

  const handleApply = async () => {
    if (!mediaBuyerId) {
      setError(true)
      return
    }
    setError(false)
    try {
      await updateMutation.mutateAsync({
        ids: rows.map((row) => row.original.id),
        mediaBuyerId,
      })
      table.toggleAllRowsSelected(false)
      setMediaBuyerId(null)
      onOpenChange(false)
      toast.success("Media buyer updated for selected ad accounts")
    } catch {
      toast.error("Failed to update media buyer")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="lg">
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Update Media Buyer</DialogTitle>
          <DialogDescription>
            Assign a media buyer to {rows.length} selected ad account{rows.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Field orientation="vertical" data-invalid={error}>
            <FieldLabel>Media Buyer</FieldLabel>
            <FieldContent>
              <MediaBuyerCombobox
                value={mediaBuyerId}
                onValueChange={(val) => { setMediaBuyerId(val); setError(false) }}
                placeholder="Select media buyer..."
              />
            </FieldContent>
            {error && <FieldError errors={[{ message: "Please select a media buyer" }]} />}
          </Field>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Applying...
              </>
            ) : (
              "Apply"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
