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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adscrush/ui/components/select"
import { toast } from "@adscrush/ui/sonner"
import { IconLoader2, IconUserCog } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { useSession } from "@/lib/auth/client"
import { ROLES, type Role } from "@adscrush/shared/constants/roles"
import { getManageableRoles } from "@adscrush/shared/utils/roles"
import { useUpdateUserRole } from "../queries"

interface ChangeRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null | undefined
  name: string | null | undefined
  currentRole: string | null | undefined
  onSuccess?: () => Promise<void> | void
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  userId,
  name,
  currentRole,
  onSuccess,
}: ChangeRoleDialogProps) {
  const { data: session } = useSession()
  const currentUserRole = (session?.user?.role as Role) || ROLES.USER
  const manageableRoles = getManageableRoles(currentUserRole)

  const [selectedRole, setSelectedRole] = useState<Role>((currentRole as Role) || ROLES.USER)
  const updateMutation = useUpdateUserRole()

  const handleAction = async () => {
    if (!userId || !selectedRole) return

    await updateMutation.mutateAsync(
      { userId, role: selectedRole },
      {
        onSuccess: async () => {
          toast.success(`User role changed to ${selectedRole.replace(/_/g, " ")}`)
          await onSuccess?.()
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message || "Failed to change role")
        },
      }
    )
  }

  // Reset selected role when dialog opens with a different user
  useEffect(() => {
    if (open) {
      setSelectedRole((currentRole as Role) || ROLES.USER)
    }
  }, [open, currentRole])

  const isLoading = updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconUserCog className="size-5 text-primary" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Change the role for <span className="font-medium">{name}</span>.
            This will affect their permissions and access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Role</label>
            <div className="text-sm text-muted-foreground capitalize">
              {currentRole?.replace(/_/g, " ") || "None"}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Role</label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as Role)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {manageableRoles.map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={isLoading || selectedRole === currentRole}
          >
            {isLoading && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            Change Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
