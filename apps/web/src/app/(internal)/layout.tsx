import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar"
import { ScrollAwareHeader } from "@/features/dashboard/components/scroll-aware-header"
import { ImpersonationBar } from "@/components/layout/impersonation-bar"
import { resolveSidebarVisibility } from "@/features/dashboard/lib/resolve-sidebar-visibility"
import { SidebarInset, SidebarProvider } from "@adscrush/ui/components/sidebar"
import { cookies, headers } from "next/headers"
import { connection } from "next/server"
import { Suspense } from "react"
import type React from "react"

async function SidebarStateProvider({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className="h-svh"
      style={
        {
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {children}
    </SidebarProvider>
  )
}

// Resolves permissions on every request — never uses a cached snapshot.
// connection() opts this component out of cacheComponents so permissions
// always reflect the current user's actual state (including after an admin
// updates permissions or starts/stops impersonating an employee).
async function SidebarWithVisibility() {
  await connection()
  const visibility = await resolveSidebarVisibility(await headers())
  return <DashboardSidebar visibility={visibility} />
}

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SidebarStateProvider>
        <SidebarWithVisibility />
        <SidebarInset className="min-h-0 min-w-0">
          <ImpersonationBar />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <ScrollAwareHeader />
            {children}
          </main>
        </SidebarInset>
      </SidebarStateProvider>
    </Suspense>
  )
}
