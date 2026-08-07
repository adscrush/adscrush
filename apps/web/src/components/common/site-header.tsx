import { Separator } from "@adscrush/ui/components/separator"
import { SidebarTrigger } from "@adscrush/ui/components/sidebar"
import { ModeToggle } from "./mode-toggle"

export function SiteHeader({ title = "Dashboard" }: { title?: string }) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-4">
        <SidebarTrigger className="-ml-1 flex lg:hidden" size="icon-lg" />
        <Separator
          orientation="vertical"
          className="mx-2 my-auto flex data-[orientation=vertical]:h-4 lg:hidden"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
