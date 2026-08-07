"use client"

import { Loader, Trash } from "lucide-react"
import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adscrush/ui/components/dialog"
import { toast } from "@adscrush/ui/sonner"
import { useDeleteCreative } from "../queries"
import type { Creative } from "../queries"
import { useRef } from "react"

interface DeleteCreativesDialogProps {
  creatives: Creative[]
  showTrigger?: boolean
  onSuccess?: () => void
  onOpenChange?: (open: boolean) => void
}

export function DeleteCreativesDialog({
  creatives,
  showTrigger = true,
  onSuccess,
  onOpenChange,
  ...props
}: DeleteCreativesDialogProps &
  Omit<React.ComponentPropsWithoutRef<typeof Dialog>, "children">) {
  const deleteCreative = useDeleteCreative()
  const closeRef = useRef<HTMLButtonElement>(null)

  const handleDelete = async () => {
    try {
      await Promise.all(
        creatives.map((c) => deleteCreative.mutateAsync({ id: c.id }))
      )
      toast.success("Creative(s) deleted")
      closeRef.current?.click()
      onSuccess?.()
    } catch {
      toast.error("Failed to delete creative(s)")
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} {...props}>
      {showTrigger && (
        <DialogTrigger
          render={
            <Button
              aria-label="Delete selected"
              variant="outline"
              size="sm"
              className="h-8"
            >
              <Trash className="mr-2 size-4" aria-hidden="true" />
              Delete
            </Button>
          }
        ></DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your{" "}
            {creatives.length > 1 && (
              <span className="font-medium">{creatives.length}</span>
            )}
            {creatives.length === 1 ? (
              <>
                {" "}
                <strong>{creatives[0]?.name}</strong> creative
              </>
            ) : (
              " creatives"
            )}{" "}
            from our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
          <span className="font-medium text-destructive">Warning:</span> Some of
          these items may be referenced by other resources.
        </div>
        <DialogFooter className="gap-2 sm:space-x-0">
          <DialogClose
            ref={closeRef}
            render={<Button variant="outline">Cancel</Button>}
          />
          <Button
            aria-label="Delete selected rows"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteCreative.isPending}
          >
            {deleteCreative.isPending && (
              <Loader
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
