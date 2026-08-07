"use client"

import { useCommandState } from "cmdk"
import type { LucideProps } from "lucide-react"
import {
  BarChart3Icon,
  BuildingIcon,
  ContrastIcon,
  CornerDownLeftIcon,
  HomeIcon,
  MoonStarIcon,
  RssIcon,
  SearchIcon,
  SettingsIcon,
  ShieldAlertIcon,
  SunMediumIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"

import { trackEvent } from "@/lib/events"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@adscrush/ui/components/command"

import { Button } from "@adscrush/ui/components/button"
import { Kbd, KbdGroup } from "@adscrush/ui/components/kbd"
import { Separator } from "@adscrush/ui/components/separator"

const Icons = {
  news: RssIcon,
  search: SearchIcon,
  contrast: ContrastIcon,
}

const Logo = ({ className }: { className?: string }) => (
  <Image
    src="/logo.png"
    alt="AdsCrush"
    width={24}
    height={24}
    className={className}
    unoptimized
  />
)

type CommandLinkItem = {
  title: string
  href: string
  icon?: React.ComponentType<LucideProps | { className?: string }>
  iconImage?: string
  keywords?: string[]
  openInNewTab?: boolean
}

const MENU_LINKS: CommandLinkItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: HomeIcon,
  },
  {
    title: "Offers",
    href: "/products",
    icon: RssIcon, // Or a tag icon
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3Icon,
  },
  {
    title: "Affiliates",
    href: "/affiliates",
    icon: UsersIcon,
  },
  {
    title: "Advertisers",
    href: "/advertisers",
    icon: BuildingIcon,
  },
]

const SERVICE_LINKS: CommandLinkItem[] = [
  {
    title: "Fraud Detection",
    href: "/fraud/logs",
    icon: ShieldAlertIcon,
  },
  {
    title: "Integration Tracking",
    href: "/integration/tracking",
    icon: ZapIcon,
  },
  {
    title: "Account Settings",
    href: "/settings",
    icon: SettingsIcon,
  },
]

export function CommandMenu({
  enabledHotkeys = true,
}: {
  enabledHotkeys?: boolean
}) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  useHotkeys(
    "mod+k, slash",
    (e) => {
      e.preventDefault()

      setOpen((prev) => {
        if (!prev) {
          trackEvent({
            name: "open_command_menu",
            properties: {
              method: "keyboard",
              key: e.key === "/" ? "/" : e.metaKey ? "cmd+k" : "ctrl+k",
            },
          })
        }
        return !prev
      })
    },
    { enabled: enabledHotkeys }
  )

  const handleOpenLink = useCallback(
    (href: string, openInNewTab = false) => {
      setOpen(false)

      trackEvent({
        name: "command_menu_action",
        properties: {
          action: "navigate",
          href: href,
          open_in_new_tab: openInNewTab,
        },
      })

      if (openInNewTab) {
        window.open(href, "_blank", "noopener")
      } else {
        router.push(href)
      }
    },
    [router]
  )

  const createThemeHandler = useCallback(
    (theme: "light" | "dark" | "system") => () => {
      setOpen(false)

      trackEvent({
        name: "command_menu_action",
        properties: {
          action: "change_theme",
          theme: theme,
        },
      })

      setTheme(theme)
    },
    [setTheme]
  )

  return (
    <>
      <CommandMenuTrigger
        onClick={() => {
          setOpen(true)
          trackEvent({
            name: "open_command_menu",
            properties: {
              method: "click",
            },
          })
        }}
      />

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandMenuInput />

          <CommandList className="min-h-80 supports-timeline-scroll:scroll-fade-effect-y">
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandLinkGroup
              heading="Navigation"
              links={MENU_LINKS}
              onLinkSelect={handleOpenLink}
            />

            <CommandLinkGroup
              heading="Services"
              links={SERVICE_LINKS}
              onLinkSelect={handleOpenLink}
            />

            <CommandGroup heading="Theme Settings">
              <CommandItem
                keywords={["theme", "light"]}
                onSelect={createThemeHandler("light")}
              >
                <SunMediumIcon />
                Light Mode
              </CommandItem>
              <CommandItem
                keywords={["theme", "dark"]}
                onSelect={createThemeHandler("dark")}
              >
                <MoonStarIcon />
                Dark Mode
              </CommandItem>
              <CommandItem
                keywords={["theme", "system"]}
                onSelect={createThemeHandler("system")}
              >
                <Icons.contrast />
                System Default
              </CommandItem>
            </CommandGroup>
          </CommandList>

          <CommandMenuFooter />
        </Command>
      </CommandDialog>
    </>
  )
}

function CommandMenuTrigger({ ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="command-menu-trigger"
      className="relative h-[34px] w-48 justify-start gap-2 rounded-full text-muted-foreground shadow-none select-none hover:bg-background hover:text-muted-foreground dark:hover:bg-input/30 sm:pr-2 md:w-56"
      variant="outline"
      size="sm"
      {...props}
    >
      <Icons.search className="size-4 shrink-0" />

      <span className="font-sans text-sm font-medium">Search…</span>

      <KbdGroup className="ml-auto hidden sm:inline-flex">
        <Kbd className="w-5 min-w-5 px-0">⌘</Kbd>
        <Kbd className="w-5 min-w-5 px-0">K</Kbd>
      </KbdGroup>
    </Button>
  )
}

function CommandMenuInput() {
  const [searchValue, setSearchValue] = useState("")

  useEffect(() => {
    if (searchValue.length >= 2) {
      const timeoutId = setTimeout(() => {
        trackEvent({
          name: "command_menu_search",
          properties: {
            query: searchValue,
            query_length: searchValue.length,
          },
        })
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [searchValue])

  return (
    <CommandInput
      placeholder="Type a command or search…"
      value={searchValue}
      onValueChange={setSearchValue}
    />
  )
}

function CommandLinkGroup({
  heading,
  links,
  fallbackIcon,
  onLinkSelect,
}: {
  heading: string
  links: CommandLinkItem[]
  fallbackIcon?: React.ComponentType<LucideProps>
  onLinkSelect: (href: string, openInNewTab?: boolean) => void
}) {
  return (
    <CommandGroup heading={heading}>
      {links.map((link) => {
        const Icon = link?.icon ?? fallbackIcon ?? React.Fragment

        return (
          <CommandItem
            key={link.href}
            keywords={link.keywords}
            onSelect={() => onLinkSelect(link.href, link.openInNewTab)}
          >
            {link?.iconImage ? (
              <Image
                className="rounded-sm"
                src={link.iconImage}
                alt={link.title}
                width={16}
                height={16}
                unoptimized
              />
            ) : (
              <Icon className="size-4" />
            )}
            <p className="line-clamp-1">{link.title}</p>
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

type CommandKind = "command" | "page" | "link"

type CommandMetaMap = Map<
  string,
  {
    commandKind: CommandKind
  }
>

function buildCommandMetaMap() {
  const commandMetaMap: CommandMetaMap = new Map()

  commandMetaMap.set("Light Mode", { commandKind: "command" })
  commandMetaMap.set("Dark Mode", { commandKind: "command" })
  commandMetaMap.set("System Default", { commandKind: "command" })

  MENU_LINKS.forEach((item) => {
    commandMetaMap.set(item.title, { commandKind: "page" })
  })

  SERVICE_LINKS.forEach((item) => {
    commandMetaMap.set(item.title, { commandKind: "page" })
  })

  return commandMetaMap
}

const COMMAND_META_MAP = buildCommandMetaMap()

const ENTER_ACTION_LABELS: Record<CommandKind, string> = {
  command: "Run Command",
  page: "Go to Page",
  link: "Open Link",
}

function CommandMenuFooter() {
  const selectedCommandKind = useCommandState(
    (state) => COMMAND_META_MAP.get(state.value)?.commandKind ?? "page"
  )

  return (
    <>
      <div className="flex h-10" />

      <div className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-between gap-2 rounded-b-2xl border-t bg-background/50 px-4 text-xs font-medium backdrop-blur-sm">
        <Logo className="size-5 opacity-70" />

        <div className="flex shrink-0 items-center gap-2 max-sm:hidden">
          <span>{ENTER_ACTION_LABELS[selectedCommandKind]}</span>
          <Kbd>
            <CornerDownLeftIcon className="size-3" />
          </Kbd>
          <Separator orientation="vertical" className="h-4 self-center" />
          <span className="text-muted-foreground">Exit</span>
          <Kbd>Esc</Kbd>
        </div>
      </div>
    </>
  )
}
