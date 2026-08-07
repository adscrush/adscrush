"use client"

import { authClient } from "@/lib/auth/client"
import { Button } from "@adscrush/ui/components/button"
import { IconUserSearch, IconLogout } from "@tabler/icons-react"
import { toast } from "@adscrush/ui/sonner"
import { useState } from "react"

export function ImpersonationBar() {
  const { data: session, isPending } = authClient.useSession()
  const [isRevoking, setIsRevoking] = useState(false)

  // Better Auth's impersonation plugin adds 'impersonatedBy' to the session
  const isImpersonating = !!session?.session?.impersonatedBy

  if (isPending || !isImpersonating) return null

  const handleStopImpersonating = async () => {
    setIsRevoking(true)
    try {
      await authClient.admin.stopImpersonating()
      toast.success("Stopped impersonating user")
      window.location.reload()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to stop impersonating")
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between z-[100] sticky top-0 shadow-md">
      <div className="flex items-center gap-2 text-sm font-medium">
        <IconUserSearch className="size-4" />
        <span>
          You are currently impersonating <strong>{session?.user?.name || session?.user?.email}</strong>
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="h-8 bg-white text-blue-600 hover:bg-blue-50 border-none font-bold"
        onClick={handleStopImpersonating}
        disabled={isRevoking}
      >
        <IconLogout className="size-4 mr-2" />
        Stop Impersonating
      </Button>
    </div>
  )
}
