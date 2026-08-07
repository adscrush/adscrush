"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@adscrush/ui/components/alert-dialog"
import { Button } from "@adscrush/ui/components/button"
import { IconLoader2 } from "@tabler/icons-react"
import { useState } from "react"

interface TopBarProps {
  label: string
  isDirty: boolean
  isSubmitting: boolean
  onDiscard?: () => void
}

export function TopBar({ label, isDirty, isSubmitting, onDiscard }: TopBarProps) {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  const handleDiscard = () => {
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      onDiscard?.()
    }
  }

  const handleConfirmDiscard = () => {
    onDiscard?.()
    setShowDiscardDialog(false)
  }

  if (!isDirty) return null

  return (
    <>
      <div className="sticky top-12 z-40 flex h-12 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Unsaved {label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={isSubmitting}
            onClick={handleDiscard}
          >
            Discard
          </Button>
          <Button type="submit" size="default" disabled={isSubmitting}>
            {isSubmitting && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            Save
          </Button>
        </div>
      </div>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard all unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              If you discard changes, you&apos;ll delete any edits you made since
              you last saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDiscard}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
