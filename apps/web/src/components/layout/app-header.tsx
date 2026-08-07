"use client"

import { SidebarTrigger } from "@adscrush/ui/components/sidebar"
import { Separator } from "@adscrush/ui/components/separator"
import { Button } from "@adscrush/ui/components/button"
import { IconLogout } from "@tabler/icons-react"
import { signOut } from "@/lib/auth/client"
import { useRouter } from "next/navigation"

export function AppHeader({ title }: { title?: string }) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/sign-in")
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-4" />
      {title && <h1 className="text-sm font-medium">{title}</h1>}
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <IconLogout className="size-4" />
          <span className="ml-1 hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}
