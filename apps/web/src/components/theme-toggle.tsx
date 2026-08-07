"use client"

import { useTheme } from "next-themes"
import { useHotkeys } from "react-hotkeys-hook"

import { META_THEME_COLORS } from "@adscrush/shared/config/site"
import { useMetaColor } from "@/hooks/use-meta-color"
import { useSound } from "@/hooks/use-sound"
import { SOUNDS } from "@/lib/sounds"

import { MoonIcon } from "./animated-icons/moon"
import { SunMediumIcon } from "./animated-icons/sun-medium"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@adscrush/ui/components/tooltip"
import { Button } from "@adscrush/ui/components/button"
import { Kbd } from "@adscrush/ui/components/kbd"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const { setMetaColor } = useMetaColor()

  const playClick = useSound(SOUNDS.click)

  const switchTheme = (sound = true) => {
    if (sound) playClick(0.2)
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
    setMetaColor(
      resolvedTheme === "dark"
        ? META_THEME_COLORS.light
        : META_THEME_COLORS.dark
    )
  }

  useHotkeys("d", () => switchTheme(true))

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="border-none"
          variant="ghost"
          size="icon-sm"
          onClick={() => switchTheme()}
        >
          <MoonIcon className="relative hidden after:absolute after:-inset-2 [html.dark_&]:block" />
          <SunMediumIcon className="relative hidden after:absolute after:-inset-2 [html.light_&]:block" />
          <span className="sr-only">Theme Toggle</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="pr-2 pl-3">
        <div className="flex items-center gap-3">
          Toggle Mode
          <Kbd>D</Kbd>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
