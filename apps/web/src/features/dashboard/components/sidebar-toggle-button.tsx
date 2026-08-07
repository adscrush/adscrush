"use client"

import { useSidebar } from "@adscrush/ui/components/sidebar"
import { Button } from "@adscrush/ui/components/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@adscrush/ui/components/tooltip"
import { PanelLeft } from "lucide-react"

/**
 * Expanded-state toggle — shown when the sidebar is open (full width).
 * Renders as a ghost icon button in the header row.
 */
export function SidebarExpandedToggle() {
  const { open, setOpen } = useSidebar()

  return (
    <Button onClick={() => setOpen(!open)} variant="ghost" size="icon-sm" className="size-8">
      <PanelLeft className="size-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

/**
 * Collapsed-state toggle — shown when the sidebar is in icon-only mode.
 * Renders as an absolutely-positioned overlay button with a tooltip.
 */
export function SidebarCollapsedToggle() {
  const { open, setOpen } = useSidebar()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setOpen(!open)}
          className="absolute inset-0 m-auto flex size-9 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground"
        >
          <PanelLeft className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">Open sidebar</TooltipContent>
    </Tooltip>
  )
}
