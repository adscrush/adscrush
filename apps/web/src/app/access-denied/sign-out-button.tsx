"use client"

import { signOut } from "@/lib/auth/client"
import { useRouter } from "next/navigation"
import { IconLogout } from "@tabler/icons-react"

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/sign-in")
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      <IconLogout className="size-4" />
      Sign out
    </button>
  )
}
