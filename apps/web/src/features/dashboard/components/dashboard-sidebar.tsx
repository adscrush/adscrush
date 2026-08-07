import { UserButton } from "@/components/auth/user-button"
import { can, type SidebarVisibilityConfig } from "@/features/dashboard/lib/resolve-sidebar-visibility"
import {
  BOTTOM_NAV,
  MAIN_NAV,
  MEDIA_BUYER_BOTTOM_NAV,
  MEDIA_BUYER_MAIN_NAV,
  type NavSection as NavSectionConfig,
} from "@/features/dashboard/config/sidebar-nav-config"
import { ROLES } from "@adscrush/shared/constants/roles"
import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@adscrush/ui/components/sidebar"

import { NavSection, type MenuItem } from "./nav-section"
import { SidebarCollapsedToggle, SidebarExpandedToggle } from "./sidebar-toggle-button"

interface DashboardSidebarProps {
  visibility: SidebarVisibilityConfig
}

/**
 * Converts a declarative NavSection config into a filtered MenuItem[] for
 * rendering, applying permission gates from the visibility config.
 *
 * Items the user cannot see are excluded entirely — no empty groups.
 */
function buildNavItems(
  section: NavSectionConfig,
  visibility: SidebarVisibilityConfig,
): MenuItem[] {
  return section.items.flatMap((item): MenuItem[] => {
    if (!can(visibility, item.permission)) return []

    if ("url" in item) {
      return [{ title: item.title, icon: item.icon, url: item.url }]
    }

    const visibleChildren = item.children.filter((child) =>
      can(visibility, child.permission),
    )
    if (visibleChildren.length === 0) return []

    return [{
      title: item.title,
      icon: item.icon,
      items: visibleChildren.map(({ title, url, className }) => ({ title, url, className })),
    }]
  })
}

export function DashboardSidebar({ visibility }: DashboardSidebarProps) {
  const isMediaBuyer = visibility.role === ROLES.MEDIA_BUYER
  const mainNav = isMediaBuyer ? MEDIA_BUYER_MAIN_NAV : MAIN_NAV
  const bottomNav = isMediaBuyer ? MEDIA_BUYER_BOTTOM_NAV : BOTTOM_NAV

  const mainNavItems = buildNavItems(mainNav, visibility)
  const bottomNavItems = buildNavItems(bottomNav, visibility)

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="flex h-12 flex-row items-center gap-0 border-b border-dashed border-border p-0! px-4 transition-[padding] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
        <div className="flex grow items-center justify-between pr-2 pl-4 group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:size-0 group-data-[collapsible=icon]:pr-0 group-data-[collapsible=icon]:pl-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-6 w-6 rounded-md">
              <AvatarImage src={"/logo.png"} alt="AdsCrush" className="rounded-md" />
              <AvatarFallback className="rounded-md">AC</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold tracking-tight text-foreground">Adscrush</span>
          </div>
          <SidebarExpandedToggle />
        </div>

        <div className="hidden group-data-[collapsible=icon]:relative group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-6 w-6 rounded-md group-hover:invisible">
            <AvatarImage src={"/logo.png"} alt="AdsCrush" className="rounded-md" />
            <AvatarFallback className="rounded-md">AC</AvatarFallback>
          </Avatar>
          <SidebarCollapsedToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavSection items={mainNavItems} />
        <div className="mt-auto">
          <NavSection items={bottomNavItems} />
        </div>
      </SidebarContent>
      <div className="border-b border-dashed border-border" />
      <SidebarFooter className="gap-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
