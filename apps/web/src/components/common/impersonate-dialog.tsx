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
import { IconLoader2, IconUserSearch } from "@tabler/icons-react"
import { useState } from "react"
import { authClient } from "@/lib/auth/client"

interface ImpersonateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null | undefined
  name: string | null | undefined
  label: string
}

export function ImpersonateDialog({ open, onOpenChange, userId, name, label }: ImpersonateDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleImpersonate = async () => {
    if (!userId) return

    setIsLoading(true)

    await authClient.admin.impersonateUser(
      {
        userId,
      },
      {
        onError: (err) => {
          toast.error(err.error.message || `Failed to impersonate ${label.toLowerCase()}`)
          setIsLoading(false)
        },
        onSuccess: () => {
          toast.success(`Now impersonating ${name}`)
          window.location.href = "/"
          setIsLoading(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconUserSearch className="size-5 text-blue-500" />
            Impersonate {label}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to impersonate{" "}
            <span className="font-medium">{name}</span>? You will be signed in
            as this {label.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImpersonate} disabled={isLoading}>
            {isLoading && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            Impersonate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
