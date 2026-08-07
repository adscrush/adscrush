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
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react"
import { useState } from "react"
import { authClient } from "@/lib/auth/client"

interface BanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null | undefined
  name: string | null | undefined
  variant: "ban" | "unban"
  onSuccess?: () => Promise<void> | void
}

export function BanDialog({ open, onOpenChange, userId, name, variant, onSuccess }: BanDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      if (variant === "ban") {
        const result = await authClient.admin.banUser({ userId })
        if (result.error) throw new Error(result.error.message || "Failed to ban user")
        toast.success("User banned successfully")
      } else {
        const result = await authClient.admin.unbanUser({ userId })
        if (result.error) throw new Error(result.error.message || "Failed to unban user")
        toast.success("User unbanned successfully")
      }
      await onSuccess?.()
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : `Failed to ${variant} user`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconAlertTriangle className="size-5 text-orange-500" />
            {variant === "ban" ? "Ban" : "Unban"} User
          </DialogTitle>
          <DialogDescription>
            {variant === "ban" ? (
              <>
                Are you sure you want to ban <span className="font-medium">{name}</span>? They will no longer
                be able to sign in.
              </>
            ) : (
              <>
                Are you sure you want to unban <span className="font-medium">{name}</span>? They will be able
                to sign in again.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={variant === "ban" ? "destructive" : "default"} onClick={handleAction} disabled={isLoading}>
            {isLoading && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            {variant === "ban" ? "Ban" : "Unban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
