"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adscrush/ui/components/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@adscrush/ui/components/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adscrush/ui/components/select"
import { Button } from "@adscrush/ui/components/button"
import { Badge } from "@adscrush/ui/components/badge"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Input } from "@adscrush/ui/components/input"
import { toast } from "@adscrush/ui/sonner"
import { cn } from "@adscrush/ui/lib/utils"
import {
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconLink,
  IconPhoto,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import * as React from "react"
import { trpc } from "@/lib/trpc/client"
import { useFunnel } from "@/features/funnels/queries"

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackingLinksBuilderDialogProps {
  campaignId: string
  adAccountId: string
  adAccountName: string
  adAccountPlatform: string
  baseTrackingLink: string
  funnelId?: string | null
}

interface CreativeLinks {
  creativeId: string
  creativeName: string
  creativeThumbnailUrl: string | null
  randomTrackingLink: string
  landingPages: Array<{
    landingPageId: string
    landingPageName: string
    trackingLink: string
  }>
}

const NO_CREATIVE = "none"
const RANDOM_LP = "random"

// ─── Component ───────────────────────────────────────────────────────────────

export function TrackingLinksBuilderDialog({
  campaignId,
  adAccountId,
  adAccountName,
  adAccountPlatform,
  baseTrackingLink,
  funnelId,
}: TrackingLinksBuilderDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedCreativeId, setSelectedCreativeId] = React.useState<string>(NO_CREATIVE)
  const [selectedLpId, setSelectedLpId] = React.useState<string>(RANDOM_LP)
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const { data, isLoading } = trpc.campaigns.getCreativeTrackingLinks.useQuery(
    { campaignId },
    { enabled: open }
  )

  const { data: funnel, isLoading: isLoadingFunnel } = useFunnel(funnelId ?? "", {
    enabled: open && !!funnelId,
  })

  const creatives: CreativeLinks[] = React.useMemo(
    () => data?.find((a) => a.adAccountId === adAccountId)?.creatives ?? [],
    [data, adAccountId]
  )

  const activeLandingPages = React.useMemo(
    () => (funnel?.landingPages ?? []).filter((lp) => lp.status === "active"),
    [funnel]
  )

  // Compose the URL for the current builder selection
  const composedUrl = React.useMemo(() => {
    if (selectedCreativeId === NO_CREATIVE) {
      if (selectedLpId === RANDOM_LP) return baseTrackingLink
      const separator = baseTrackingLink.includes("?") ? "&" : "?"
      return `${baseTrackingLink}${separator}lp=${selectedLpId}`
    }
    const creative = creatives.find((c) => c.creativeId === selectedCreativeId)
    if (!creative) return baseTrackingLink
    if (selectedLpId === RANDOM_LP) return creative.randomTrackingLink
    return (
      creative.landingPages.find((lp) => lp.landingPageId === selectedLpId)?.trackingLink ??
      creative.randomTrackingLink
    )
  }, [selectedCreativeId, selectedLpId, baseTrackingLink, creatives])

  const handleCopy = async (url: string, key: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedKey(key)
      toast.success("Tracking link copied to clipboard", { duration: 2000 })
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      toast.error("Failed to copy tracking link")
    }
  }

  const handleCopyAll = async (urls: string[], key: string) => {
    try {
      await navigator.clipboard.writeText(urls.join("\n"))
      setCopiedKey(key)
      toast.success(`Copied ${urls.length} tracking links`, { duration: 3000 })
      setTimeout(() => setCopiedKey(null), 3000)
    } catch {
      toast.error("Failed to copy tracking links")
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSelectedCreativeId(NO_CREATIVE)
      setSelectedLpId(RANDOM_LP)
      setBulkOpen(false)
      setSearchQuery("")
    }
  }

  // Bulk section: filter creatives by search query
  const filteredCreatives = React.useMemo(() => {
    if (!searchQuery.trim()) return creatives
    const query = searchQuery.toLowerCase().trim()
    return creatives.filter(
      (creative) =>
        creative.creativeName.toLowerCase().includes(query) ||
        creative.landingPages.some((lp) => lp.landingPageName.toLowerCase().includes(query))
    )
  }, [creatives, searchQuery])

  const totalUrls = React.useMemo(
    () => creatives.reduce((sum, c) => sum + 1 + c.landingPages.length, 0),
    [creatives]
  )

  const isLoadingData = isLoading || (!!funnelId && isLoadingFunnel)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <IconLink data-icon="inline-start" />
            Tracking Links
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tracking Links</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Build a tracking URL for
            <span className="font-medium text-foreground">{adAccountName}</span>
            <Badge variant="secondary" className="text-[10px] uppercase">
              {adAccountPlatform}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-2 overflow-y-auto max-h-[calc(85vh-120px)] pr-1">
          {isLoadingData ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {/* ─── Builder ─── */}
              <div className="flex flex-col gap-4">
                {creatives.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Creative</label>
                    <Select value={selectedCreativeId} onValueChange={setSelectedCreativeId}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value={NO_CREATIVE}>None (ad account link)</SelectItem>
                        {creatives.map((creative) => (
                          <SelectItem key={creative.creativeId} value={creative.creativeId}>
                            <CreativeOption
                              name={creative.creativeName}
                              thumbnailUrl={creative.creativeThumbnailUrl}
                            />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {activeLandingPages.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Landing Page</label>
                    <Select value={selectedLpId} onValueChange={setSelectedLpId}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value={RANDOM_LP}>Random (Default)</SelectItem>
                        {activeLandingPages.map((lp) => (
                          <SelectItem key={lp.id} value={lp.id}>
                            {lp.name || lp.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* URL preview */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Your tracking URL</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 min-w-0 truncate rounded-md border bg-muted/40 px-3 py-2.5 text-xs">
                      {composedUrl}
                    </code>
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleCopy(composedUrl, "builder")}
                    >
                      {copiedKey === "builder" ? (
                        <>
                          <IconCheck data-icon="inline-start" className="text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <IconCopy data-icon="inline-start" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  {selectedLpId === RANDOM_LP && activeLandingPages.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Random rotates across all active landing pages.
                    </p>
                  )}
                </div>

                {creatives.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      No creatives linked to this campaign. Link creatives to generate
                      per-creative tracking URLs.
                    </p>
                  </div>
                )}
              </div>

              {/* ─── Bulk: all URL combinations ─── */}
              {creatives.length > 0 && (
                <Collapsible open={bulkOpen} onOpenChange={setBulkOpen}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50">
                    <span className="flex items-center gap-2">
                      <IconChevronRight
                        className={cn(
                          "size-4 transition-transform",
                          bulkOpen && "rotate-90"
                        )}
                      />
                      All URL combinations
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {totalUrls} URL{totalUrls !== 1 ? "s" : ""}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <div className="flex flex-col gap-3">
                      {/* Search */}
                      <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by creative or landing page name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-9"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Clear search"
                          >
                            <IconX className="size-4" />
                          </button>
                        )}
                      </div>

                      {filteredCreatives.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            No results found for &quot;{searchQuery}&quot;
                          </p>
                        </div>
                      ) : (
                        filteredCreatives.map((creative) => {
                          const creativeUrls = [
                            creative.randomTrackingLink,
                            ...creative.landingPages.map((lp) => lp.trackingLink),
                          ]
                          const copyAllKey = `all-${creative.creativeId}`

                          return (
                            <div key={creative.creativeId} className="rounded-lg border">
                              <div className="flex items-center justify-between gap-2 border-b bg-muted/30 p-2.5">
                                <div className="flex min-w-0 items-center gap-2">
                                  <CreativeThumbnail
                                    name={creative.creativeName}
                                    thumbnailUrl={creative.creativeThumbnailUrl}
                                    size="size-8"
                                  />
                                  <span className="truncate text-sm font-medium">
                                    {creative.creativeName}
                                  </span>
                                  <Badge variant="outline" className="shrink-0 text-[10px]">
                                    {creativeUrls.length} URL{creativeUrls.length !== 1 ? "s" : ""}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 shrink-0 text-xs"
                                  onClick={() => handleCopyAll(creativeUrls, copyAllKey)}
                                >
                                  {copiedKey === copyAllKey ? (
                                    <IconCheck className="mr-1 size-3.5 text-green-600" />
                                  ) : (
                                    <IconCopy className="mr-1 size-3.5" />
                                  )}
                                  Copy All
                                </Button>
                              </div>
                              <div className="flex flex-col gap-2 p-2.5">
                                <UrlCopyRow
                                  label="Random"
                                  url={creative.randomTrackingLink}
                                  isDefault
                                  copied={copiedKey === `${creative.creativeId}-random`}
                                  onCopy={() =>
                                    handleCopy(
                                      creative.randomTrackingLink,
                                      `${creative.creativeId}-random`
                                    )
                                  }
                                />
                                {creative.landingPages.map((lp) => {
                                  const lpKey = `${creative.creativeId}-lp-${lp.landingPageId}`
                                  return (
                                    <UrlCopyRow
                                      key={lpKey}
                                      label={lp.landingPageName}
                                      url={lp.trackingLink}
                                      copied={copiedKey === lpKey}
                                      onCopy={() => handleCopy(lp.trackingLink, lpKey)}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CreativeThumbnail({
  name,
  thumbnailUrl,
  size,
}: {
  name: string
  thumbnailUrl: string | null
  size: "size-5" | "size-8"
}) {
  if (thumbnailUrl) {
    return <img src={thumbnailUrl} alt={name} className={cn(size, "rounded-md object-cover shrink-0")} />
  }
  return (
    <div className={cn(size, "flex items-center justify-center rounded-md bg-muted shrink-0")}>
      <IconPhoto className="size-4 text-muted-foreground/50" />
    </div>
  )
}

function CreativeOption({
  name,
  thumbnailUrl,
}: {
  name: string
  thumbnailUrl: string | null
}) {
  return (
    <span className="flex items-center gap-2">
      <CreativeThumbnail name={name} thumbnailUrl={thumbnailUrl} size="size-5" />
      <span className="truncate">{name}</span>
    </span>
  )
}

function UrlCopyRow({
  label,
  url,
  copied,
  onCopy,
  isDefault = false,
}: {
  label: string
  url: string
  copied: boolean
  onCopy: () => void
  isDefault?: boolean
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          {isDefault && (
            <Badge variant="secondary" className="text-[10px]">
              Default
            </Badge>
          )}
        </div>
        <code className="block w-full truncate rounded border bg-background px-2 py-1.5 text-xs text-foreground/80">
          {url}
        </code>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={onCopy}>
        {copied ? (
          <IconCheck className="size-3.5 text-green-600" />
        ) : (
          <IconCopy className="size-3.5" />
        )}
      </Button>
    </div>
  )
}
