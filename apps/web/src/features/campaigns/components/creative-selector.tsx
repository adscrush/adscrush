"use client"

import { Badge } from "@adscrush/ui/components/badge"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@adscrush/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@adscrush/ui/components/popover"
import { cn } from "@adscrush/ui/lib/utils"
import { Button } from "@adscrush/ui/components/button"
import { trpc } from "@/lib/trpc/client"
import { UploadCreativeDialog } from "@/features/creatives/components/upload-creative-dialog"
import type { Creative } from "@/features/creatives/queries"
import {
  IconCheck,
  IconLoader2,
  IconPhoto,
  IconPlayerPlayFilled,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import * as React from "react"

const MAX_CREATIVES = 50

/** Resolve the best still image for a creative (explicit thumbnail, else the file itself). */
function getPreviewImage(creative: Creative): string | null {
  if (creative.thumbnailUrl) return creative.thumbnailUrl
  if (creative.fileType === "image" && creative.cdnUrl) return creative.cdnUrl
  return null
}

function isVideoCreative(creative: Creative): boolean {
  return (
    creative.fileType === "video" ||
    (creative.mimeType?.startsWith("video/") ?? false)
  )
}

/** Small square preview used in the dropdown list and selected badges. */
function CreativeThumbnail({
  creative,
  className,
}: {
  creative: Creative
  className?: string
}) {
  const image = getPreviewImage(creative)
  const isVideo = isVideoCreative(creative)

  return (
    <div
      className={cn(
        "relative size-8 shrink-0 overflow-hidden rounded border bg-muted",
        className
      )}
    >
      {image ? (
        <img
          src={image}
          alt={creative.name}
          className="size-full object-cover"
        />
      ) : isVideo && creative.cdnUrl ? (
        // No poster available — let the browser render the first video frame
        <video
          src={creative.cdnUrl}
          className="size-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <IconPhoto className="size-4 text-muted-foreground" />
        </div>
      )}
      {isVideo && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <IconPlayerPlayFilled className="size-3 text-white/90" />
        </span>
      )}
    </div>
  )
}

interface CreativeSelectorProps {
  /** The product ID to scope available creatives */
  productId: string | null
  /** Currently selected creative IDs */
  value: string[]
  /** Callback when selection changes */
  onValueChange: (ids: string[]) => void
  /** Whether the selector is disabled */
  disabled?: boolean
}

export function CreativeSelector({
  productId,
  value,
  onValueChange,
  disabled,
}: CreativeSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const utils = trpc.useUtils()

  const creativesQuery = trpc.creatives.list.useQuery(
    { productId: productId!, perPage: 50 },
    { enabled: !!productId, staleTime: 30_000 }
  )

  const creatives = creativesQuery.data?.items ?? []
  const isDisabled = disabled || !productId

  const selectedCreatives = creatives.filter((c) => value.includes(c.id))

  const normalizedSearch = search.trim().toLowerCase()
  const filteredCreatives = normalizedSearch
    ? creatives.filter((c) => c.name.toLowerCase().includes(normalizedSearch))
    : creatives

  function handleToggle(creativeId: string) {
    if (value.includes(creativeId)) {
      onValueChange(value.filter((id) => id !== creativeId))
    } else {
      if (value.length >= MAX_CREATIVES) return
      onValueChange([...value, creativeId])
    }
  }

  function handleRemove(creativeId: string) {
    onValueChange(value.filter((id) => id !== creativeId))
  }

  async function handleUploaded(creative: { id: string }) {
    // Refresh the list so the new creative shows up, then auto-select it
    await utils.creatives.list.invalidate()
    if (!value.includes(creative.id) && value.length < MAX_CREATIVES) {
      onValueChange([...value, creative.id])
    }
    setSearch("")
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setSearch("")
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={isDisabled}
            className={cn(
              "flex h-7 w-full items-center justify-between rounded-md border border-input bg-input/20 px-2 py-0.5 text-sm transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              "dark:bg-input/30",
              !value.length && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {isDisabled
                ? "Select a funnel first"
                : value.length > 0
                  ? `${value.length} creative${value.length === 1 ? "" : "s"} selected`
                  : "Select creatives..."}
            </span>
            <IconPhoto className="ml-auto size-3.5 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search creatives..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {creativesQuery.isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : creatives.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No creatives available for this offer.
                  </p>
                  <UploadCreativeDialog
                    showTrigger={false}
                    productId={productId}
                    onUploaded={handleUploaded}
                    trigger={
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <IconUpload className="size-4" />
                        Upload a creative
                      </Button>
                    }
                  />
                </div>
              ) : filteredCreatives.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No creatives found.
                  </p>
                  <UploadCreativeDialog
                    showTrigger={false}
                    productId={productId}
                    defaultName={search.trim()}
                    onUploaded={handleUploaded}
                    trigger={
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <IconUpload className="size-4" />
                        {search.trim()
                          ? `Upload "${search.trim()}"`
                          : "Upload a creative"}
                      </Button>
                    }
                  />
                </div>
              ) : (
                <CommandGroup>
                  {filteredCreatives.map((creative) => {
                    const isSelected = value.includes(creative.id)
                    const isAtLimit =
                      value.length >= MAX_CREATIVES && !isSelected

                    return (
                      <CommandItem
                        key={creative.id}
                        value={`${creative.name} ${creative.id}`}
                        onSelect={() => handleToggle(creative.id)}
                        disabled={isAtLimit}
                        className="gap-2"
                      >
                        {/* Thumbnail */}
                        <CreativeThumbnail creative={creative} />

                        {/* Name */}
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {creative.name}
                        </span>

                        {/* Check indicator */}
                        <IconCheck
                          className={cn(
                            "ml-auto size-4 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
          {value.length >= MAX_CREATIVES && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              Maximum of {MAX_CREATIVES} creatives reached.
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected creatives as badges */}
      {selectedCreatives.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCreatives.map((creative) => (
            <Badge
              key={creative.id}
              variant="secondary"
              className="gap-1.5 py-1 pl-1 pr-1"
            >
              <CreativeThumbnail creative={creative} className="size-6" />
              <span className="max-w-[120px] truncate">{creative.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(creative.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${creative.name}`}
              >
                <IconX className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
