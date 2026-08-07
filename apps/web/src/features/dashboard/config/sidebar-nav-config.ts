import type { Permission } from "@adscrush/shared/constants/permissions"
import type { MenuIconKey } from "../components/nav-section"

/**
 * Declarative nav config — single source of truth for sidebar structure and
 * permission gates.
 *
 * Rules:
 *  - `permission: null`  → always visible to authenticated users (no gate)
 *  - `permission: string` → only visible when the user holds that permission
 *
 * Adding a new menu item or changing a gate requires editing only this file.
 * The resolver and sidebar builder both derive their logic from here.
 */

export interface SubNavItem {
  title: string
  url: string
  /** Permission required to see this sub-item. null = always visible. */
  permission: Permission | null
  /** Optional extra CSS class for custom styling (e.g. muted admin links). */
  className?: string
}

interface NavItemBase {
  title: string
  icon: MenuIconKey
  /** Permission required to see this top-level item. null = always visible. */
  permission: Permission | null
}

/** A top-level item that navigates directly to a URL. */
export interface NavLinkItem extends NavItemBase {
  url: string
  children?: never
}

/** A top-level item that expands into a collapsible group of sub-items. */
export interface NavGroupItem extends NavItemBase {
  url?: never
  children: SubNavItem[]
}

export type NavItem = NavLinkItem | NavGroupItem

export interface NavSection {
  id: string
  items: NavItem[]
}

// ---------------------------------------------------------------------------
// Main navigation
// ---------------------------------------------------------------------------

export const MAIN_NAV: NavSection = {
  id: "main",
  items: [
    {
      title: "Dashboard",
      icon: "Home",
      url: "/dashboard",
      permission: null,
    },
    {
      title: "Campaigns",
      icon: "Megaphone",
      permission: "campaigns.view",
      children: [
        { title: "All Campaigns", url: "/campaigns", permission: null },
        { title: "Create Campaign", url: "/campaigns/new", permission: "campaigns.create" },
      ],
    },
    {
      title: "Reports / Logs",
      icon: "BarChart3",
      permission: null,
      children: [
        { title: "General Reports", url: "/reports", permission: null },
        { title: "Reports KPI", url: "/reports/kpi", permission: null },
        { title: "Conversion Logs", url: "/reports/conversions", permission: null },
        { title: "Click Logs", url: "/reports/clicks", permission: null },
      ],
    },
    {
      title: "Leads",
      icon: "Tag",
      url: "/leads",
      permission: "leads.view",
    },
    {
      title: "Advertisers",
      icon: "Building",
      url: "/advertisers",
      permission: "advertiser.view",
    },
    {
      title: "Products",
      icon: "Package",
      url: "/products",
      permission: "products.view",
    },
    {
      title: "Funnels",
      icon: "GitBranch",
      url: "/funnels",
      permission: "funnels.view",
    },
    {
      title: "Media Buyers",
      icon: "Users",
      url: "/media-buyers",
      permission: "media_buyers.view",
    },
    {
      title: "Ad Accounts",
      icon: "CreditCard",
      url: "/ad-accounts",
      permission: "ad_accounts.view",
    },
    {
      title: "Creatives",
      icon: "Image",
      url: "/creatives",
      permission: "creatives.view",
    },
    {
      title: "Media Library",
      icon: "FolderOpen",
      permission: null,
      children: [
        { title: "Library", url: "/media", permission: null },
        { title: "Admin", url: "/media/admin", permission: "media.admin", className: "text-xs text-muted-foreground" },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Bottom navigation
// ---------------------------------------------------------------------------

export const BOTTOM_NAV: NavSection = {
  id: "bottom",
  items: [
    {
      title: "Profile",
      icon: "CircleUser",
      url: "/profile",
      permission: null,
    },
    {
      title: "Employees",
      icon: "UserCog",
      permission: "employees.view",
      children: [
        { title: "All Employees", url: "/employees", permission: null },
        { title: "Departments", url: "/departments", permission: null },
        { title: "Users", url: "/users", permission: null },
      ],
    },
    {
      title: "Settings",
      icon: "Settings",
      permission: "settings.view",
      children: [
        { title: "General Settings", url: "/settings", permission: null },
        { title: "Categories", url: "/categories", permission: null },
        { title: "Languages", url: "/languages", permission: null },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Media buyer navigation — separate set of nav items for the portal experience
// ---------------------------------------------------------------------------

export const MEDIA_BUYER_MAIN_NAV: NavSection = {
  id: "main",
  items: [
    {
      title: "Dashboard",
      icon: "Home",
      url: "/p/dashboard",
      permission: null,
    },
    {
      title: "My Campaigns",
      icon: "Megaphone",
      permission: "campaigns.view",
      children: [
        { title: "All Campaigns", url: "/p/campaigns", permission: null },
        { title: "Create Campaign", url: "/p/campaigns/new", permission: "campaigns.create" },
      ],
    },
    {
      title: "My Creatives",
      icon: "Image",
      url: "/p/creatives",
      permission: "creatives.view",
    },
    {
      title: "Leads",
      icon: "Tag",
      url: "/p/leads",
      permission: "leads.view",
    },
    {
      title: "My Media",
      icon: "FolderOpen",
      url: "/p/media",
      permission: "media.upload",
    },
    {
      title: "Reports / Logs",
      icon: "BarChart3",
      permission: "report.view",
      children: [
        { title: "General Reports", url: "/p/reports", permission: null },
        { title: "Reports KPI", url: "/p/reports/kpi", permission: null },
        { title: "Conversion Logs", url: "/p/reports/conversions", permission: "report.conversion_log_access" },
        { title: "Click Logs", url: "/p/reports/clicks", permission: "report.click_log_access" },
      ],
    },
    {
      title: "Ad Accounts",
      icon: "CreditCard",
      url: "/p/ad-accounts",
      permission: "ad_accounts.view",
    },
    {
      title: "Products",
      icon: "Package",
      url: "/p/products",
      permission: "products.view",
    },
    {
      title: "Funnels",
      icon: "GitBranch",
      url: "/p/funnels",
      permission: "funnels.view",
    },
    {
      title: "Advertisers",
      icon: "Building",
      url: "/p/advertisers",
      permission: "advertiser.view",
    },
  ],
}

export const MEDIA_BUYER_BOTTOM_NAV: NavSection = {
  id: "bottom",
  items: [
    {
      title: "Profile",
      icon: "CircleUser",
      url: "/p/profile",
      permission: null,
    },
  ],
}

// ---------------------------------------------------------------------------
// Derived: all unique gate permissions across both nav sections
// Used by the resolver to build SidebarVisibilityConfig programmatically.
// ---------------------------------------------------------------------------

function collectGates(sections: NavSection[]): Set<Permission> {
  const gates = new Set<Permission>()
  for (const section of sections) {
    for (const item of section.items) {
      if (item.permission) gates.add(item.permission)
      for (const child of item.children ?? []) {
        if (child.permission) gates.add(child.permission)
      }
    }
  }
  return gates
}

export const ALL_NAV_GATE_PERMISSIONS: ReadonlySet<Permission> = collectGates([
  MAIN_NAV,
  BOTTOM_NAV,
  MEDIA_BUYER_MAIN_NAV,
  MEDIA_BUYER_BOTTOM_NAV,
])
