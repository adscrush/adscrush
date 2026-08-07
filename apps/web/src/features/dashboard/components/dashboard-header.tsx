"use client"

import { CommandMenu } from "@/components/common/command-menu"
import { SidebarTrigger } from "@adscrush/ui/components/sidebar"
import { Separator } from "@adscrush/ui/components/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@adscrush/ui/components/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardHeader({ scrolled }: { scrolled?: boolean }) {
  return (
    <header
      className={`sticky top-0 z-50 flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4 transition-all duration-300 ${
        scrolled ? "border-dashed bg-background/95 backdrop-blur-xl" : "border-dashed bg-background"
      }`}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 md:hidden" />
        <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2">
        <CommandMenu />
        <ThemeToggle />
      </div>
    </header>
  )
}
