"use client"

import { usePathname } from "next/navigation"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@adscrush/ui/components/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@adscrush/ui/components/sidebar"
import {
  BarChart3,
  Building,
  ChevronRight,
  CircleUser,
  CreditCard,
  FolderOpen,
  GitBranch,
  Home,
  Image,
  Megaphone,
  Package,
  Receipt,
  Settings,
  Tag,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Tag,
  BarChart3,
  Users,
  Building,
  UserCog,
  CircleUser,
  Settings,
  CreditCard,
  FolderOpen,
  GitBranch,
  Image,
  Package,
  Receipt,
  Megaphone,
}

export type MenuIconKey = keyof typeof ICON_MAP

export interface MenuItem {
  title: string
  url?: string
  icon: MenuIconKey
  items?: {
    title: string
    url: string
    onClick?: () => void
    className?: string
  }[]
  onClick?: () => void
}

export interface NavSectionProps {
  items: MenuItem[]
}

export function NavSection({ items }: NavSectionProps) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = item.items && item.items.length > 0
            const isActive = item.url ? (item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)) : false
            const Icon = ICON_MAP[item.icon] ?? Home

            if (!hasChildren) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={!!item.url}
                    isActive={isActive}
                    onClick={item.onClick}
                    tooltip={item.title}
                    className="h-9 px-3 py-2 text-[13px] font-medium tracking-tight data-[active=true]:bg-primary/10 data-[active=true]:text-primary dark:data-[active=true]:bg-sidebar-accent dark:data-[active=true]:text-sidebar-accent-foreground"
                  >
                    {item.url ? (
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    ) : (
                      <>
                        <Icon />
                        <span>{item.title}</span>
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.items?.some((sub) => pathname === sub.url)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className="h-9 border border-transparent px-3 py-2 text-[13px] font-medium tracking-tight"
                    >
                      <Icon />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild={!subItem.onClick}
                            isActive={pathname === subItem.url}
                            onClick={subItem.onClick}
                            className={subItem.className}
                          >
                            {subItem.onClick ? (
                              <div className="flex w-full items-center">
                                <span>{subItem.title}</span>
                              </div>
                            ) : (
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
