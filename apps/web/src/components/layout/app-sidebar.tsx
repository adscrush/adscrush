"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconDashboard,
  IconAd2,
  IconUsers,
  IconBuildingStore,
  IconChartBar,
  IconUserCog,
  IconChevronRight,
  IconHierarchy2,
} from "@tabler/icons-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@adscrush/ui/components/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from "@adscrush/ui/components/sidebar"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { title: "Products", href: "/products", icon: IconAd2 },
  { title: "Funnels", href: "/funnels", icon: IconHierarchy2 },
  { title: "Affiliates", href: "/affiliates", icon: IconUsers },
  { title: "Advertisers", href: "/advertisers", icon: IconBuildingStore },
  { title: "Employees", href: "/employees", icon: IconUserCog },
]

const reportsSubItems = [
  { title: "General Reports", href: "/reports" },
  { title: "Click Logs", href: "/reports/clicks" },
  { title: "Conversion Logs", href: "/reports/conversions" },
  { title: "Reports KPI", href: "/reports/kpi" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const isReportsActive = pathname.startsWith("/reports")

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold">
            AC
          </div>
          <span className="text-lg font-semibold">AdsCrush</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manager Access</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* Reports collapsible submenu */}
              <Collapsible
                asChild
                defaultOpen={isReportsActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Reports"
                      isActive={isReportsActive}
                    >
                      <IconChartBar className="size-4" />
                      <span>Reports</span>
                      <IconChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {reportsSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.href}
                          >
                            <Link href={subItem.href}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <div className="text-muted-foreground px-2 py-1 text-xs">
          AdsCrush v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
