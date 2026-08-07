"use client"

import * as React from "react"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import { Badge } from "@adscrush/ui/components/badge"
import { Card, CardContent } from "@adscrush/ui/components/card"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import {
  Command,
  CommandEmpty,
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
import { getInitials } from "@adscrush/shared/lib/initials"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@adscrush/ui/components/pagination"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@adscrush/ui/components/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@adscrush/ui/components/alert-dialog"
import { toast } from "@adscrush/ui/sonner"
import {
  IconCheck,
  IconCopy,
  IconLoader2,
  IconSearch,
  IconTrash,
  IconUsers,
  IconPlus,
} from "@tabler/icons-react"
import { cn } from "@adscrush/ui/lib/utils"
import { useHasPermission } from "@/hooks/use-permission"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { TrackingLinksBuilderDialog } from "./tracking-links-builder-dialog"
import { useCampaignAdAccountsFull, useAssignAdAccount, useRemoveAdAccount } from "../queries"

interface CampaignAdAccountsTabProps {
  campaignId: string
  funnelId?: string | null
}

const ITEMS_PER_PAGE = 25

const platformColors: Record<string, string> = {
  facebook: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  google: "bg-red-500/15 text-red-400 border-red-500/20",
  tiktok: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  taboola: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  outbrain: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  native: "bg-purple-500/15 text-purple-400 border-purple-500/20",
}

type FilterType = "all" | "assigned"

export function CampaignAdAccountsTab({
  campaignId,
  funnelId,
}: CampaignAdAccountsTabProps) {
  const canEdit = useHasPermission("campaigns.edit")
  const assignAdAccount = useAssignAdAccount()
  const removeAdAccount = useRemoveAdAccount()

  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [activeFilter, setActiveFilter] = React.useState<FilterType>("all")
  const [selectedMediaBuyerIds, setSelectedMediaBuyerIds] = React.useState<string[]>([])
  const [mbSearchOpen, setMbSearchOpen] = React.useState(false)
  const [mbSearchQuery, setMbSearchQuery] = React.useState("")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = React.useState<{
    id: string
    name: string
  } | null>(null)

  const mediaBuyersQuery = trpc.mediaBuyers.search.useQuery(
    { q: mbSearchQuery || undefined },
    { enabled: mbSearchOpen, staleTime: 30_000 }
  )
  const mediaBuyers = mediaBuyersQuery.data ?? []

  const updateDebouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value)
    setCurrentPage(1)
  }, 300)

  React.useEffect(() => {
    updateDebouncedSearch(searchInput)
  }, [searchInput, updateDebouncedSearch])

  const { data, isLoading } = useCampaignAdAccountsFull(
    campaignId,
    {
      search: debouncedSearch || undefined,
      filter: activeFilter,
      mediaBuyerIds: selectedMediaBuyerIds.length > 0 ? selectedMediaBuyerIds : undefined,
      page: currentPage,
      perPage: ITEMS_PER_PAGE,
    }
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const assignedCount = data?.assignedCount ?? 0
  const pageCount = data?.pageCount ?? 1

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter)
    setCurrentPage(1)
  }

  const handleMediaBuyerToggle = (id: string) => {
    setSelectedMediaBuyerIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      return next
    })
    setCurrentPage(1)
  }

  const handleCopy = async (trackingLink: string, id: string) => {
    try {
      await navigator.clipboard.writeText(trackingLink)
      setCopiedId(id)
      toast.success("Tracking link copied to clipboard", { duration: 3000 })
      setTimeout(() => setCopiedId(null), 3000)
    } catch {
      toast.error("Failed to copy tracking link")
    }
  }

  const handleAssign = (adAccountId: string) => {
    assignAdAccount.mutate(
      { campaignId, adAccountId },
      {
        onSuccess: () => {
          toast.success("Ad account assigned to campaign")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to assign ad account")
        },
      }
    )
  }

  const handleRemoveConfirm = () => {
    if (!removeTarget) return

    removeAdAccount.mutate(
      { campaignId, adAccountId: removeTarget.id },
      {
        onSuccess: () => {
          toast.success("Ad account removed from campaign")
          setRemoveTarget(null)
        },
        onError: (error) => {
          toast.error(error.message || "Failed to remove ad account")
          setRemoveTarget(null)
        },
      }
    )
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pageCount) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
      {/* Left Column — Ad Accounts List */}
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        {/* Search + Media Buyer Filter + Result Count */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or account ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Media Buyer Multi-Select Combobox */}
          <Popover open={mbSearchOpen} onOpenChange={setMbSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={mbSearchOpen}
                className="w-full shrink-0 justify-between sm:w-56 font-normal"
              >
                {selectedMediaBuyerIds.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="size-4 shrink-0">
                      {mediaBuyers.find((m) => m.id === selectedMediaBuyerIds[0])?.image ? (
                        <AvatarImage
                          src={mediaBuyers.find((m) => m.id === selectedMediaBuyerIds[0])!.image!}
                          alt=""
                        />
                      ) : null}
                      <AvatarFallback className="text-[0.35rem]">
                        {getInitials(mediaBuyers.find((m) => m.id === selectedMediaBuyerIds[0])?.name ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {mediaBuyers.find((m) => m.id === selectedMediaBuyerIds[0])?.name}
                    </span>
                    {selectedMediaBuyerIds.length > 1 && (
                      <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
                        +{selectedMediaBuyerIds.length - 1}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Media Buyers</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search media buyers..."
                  value={mbSearchQuery}
                  onValueChange={setMbSearchQuery}
                />
                <CommandList>
                  {mediaBuyersQuery.isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : mediaBuyers.length === 0 ? (
                    <CommandEmpty>No media buyers found.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {mediaBuyers.map((mb) => {
                        const isSelected = selectedMediaBuyerIds.includes(mb.id)
                        return (
                          <CommandItem
                            key={mb.id}
                            value={mb.id}
                            onSelect={() => handleMediaBuyerToggle(mb.id)}
                            className="gap-2"
                          >
                            <Avatar className="size-4 shrink-0">
                              <AvatarImage src={mb.image ?? undefined} alt={mb.name ?? ""} />
                              <AvatarFallback className="text-[0.4rem]">
                                {getInitials(mb.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-xs font-medium">{mb.name}</span>
                              <span className="truncate text-[9px] text-muted-foreground">{mb.email}</span>
                            </div>
                            <IconCheck
                              className={cn(
                                "ml-auto size-3.5 shrink-0",
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
            </PopoverContent>
          </Popover>
          {!isLoading && (
            <p className="shrink-0 text-sm text-muted-foreground">
              {activeFilter === "assigned" ? (
                <>
                  <span className="font-medium text-foreground">{assignedCount}</span> assigned
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{total}</span> ad accounts
                </>
              )}
            </p>
          )}
        </div>

        {/* List */}
        <div className="rounded-lg border bg-card">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <Skeleton className="h-4 w-14 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <IconSearch className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {debouncedSearch
                  ? `No ad accounts found matching "${debouncedSearch}"`
                  : activeFilter === "assigned"
                    ? "No ad accounts assigned yet"
                    : "No ad accounts available"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((account) => (
                <div
                  key={account.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30",
                    account.isAssigned && "bg-muted/15"
                  )}
                >
                  {/* Account Info */}
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[9px] font-semibold uppercase border px-1.5 py-0",
                        platformColors[account.platform.toLowerCase()] ?? "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {account.platform}
                    </Badge>
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="truncate text-[13px] font-medium">
                        {account.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground font-mono">
                        {account.accountId}
                      </span>
                    </div>
                  </div>

                  {/* Media Buyer */}
                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    {account.mediaBuyer ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="size-4 shrink-0">
                          {account.mediaBuyer.image ? (
                            <AvatarImage src={account.mediaBuyer.image} alt={account.mediaBuyer.name} />
                          ) : null}
                          <AvatarFallback className="text-[0.4rem]">
                            {getInitials(account.mediaBuyer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-[11px] text-muted-foreground max-w-[100px]">
                          {account.mediaBuyer.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {account.isAssigned ? (
                      <>
                        <TrackingLinksBuilderDialog
                          campaignId={campaignId}
                          adAccountId={account.id}
                          adAccountName={account.name}
                          adAccountPlatform={account.platform}
                          baseTrackingLink={account.trackingLink!}
                          funnelId={funnelId}
                        />

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7"
                              onClick={() =>
                                handleCopy(account.trackingLink!, account.id)
                              }
                              aria-label="Copy tracking link"
                            >
                              {copiedId === account.id ? (
                                <IconCheck className="size-3.5 text-green-500" />
                              ) : (
                                <IconCopy className="size-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy tracking link</TooltipContent>
                        </Tooltip>

                        {canEdit && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  setRemoveTarget({
                                    id: account.id,
                                    name: account.name,
                                  })
                                }
                                aria-label={`Remove ${account.name}`}
                              >
                                <IconTrash className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove from campaign</TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[11px] px-2"
                          onClick={() => handleAssign(account.id)}
                          disabled={assignAdAccount.isPending}
                        >
                          <IconPlus className="mr-1 size-3" />
                          Assign
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pageCount > 1 && !isLoading && (
          <div className="flex items-center justify-between">
            <p className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total}
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={cn(
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  let pageNum: number
                  if (pageCount <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= pageCount - 2) {
                    pageNum = pageCount - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNum)}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={cn(
                      currentPage === pageCount &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Right Column — Stats Sidebar */}
      <div className="w-full shrink-0 lg:w-56">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <IconUsers className="size-4 text-muted-foreground" />
                Ad Accounts
              </div>
            </div>
            <div className="flex flex-col">
              <button
                onClick={() => handleFilterChange("all")}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-muted/50",
                  activeFilter === "all" && "bg-muted/60 font-medium"
                )}
              >
                <span className="text-muted-foreground">All Ad Accounts</span>
                <Badge
                  variant={activeFilter === "all" ? "default" : "secondary"}
                  className="font-mono text-xs"
                >
                  {isLoading ? <Skeleton className="h-3.5 w-7" /> : total}
                </Badge>
              </button>
              <div className="mx-4 border-t border-border" />
              <button
                onClick={() => handleFilterChange("assigned")}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-muted/50",
                  activeFilter === "assigned" && "bg-muted/60 font-medium"
                )}
              >
                <span className="text-muted-foreground">Assigned</span>
                <Badge
                  variant={activeFilter === "assigned" ? "default" : "secondary"}
                  className="font-mono text-xs"
                >
                  {isLoading ? <Skeleton className="h-3.5 w-7" /> : assignedCount}
                </Badge>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Ad Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">{removeTarget?.name}</span> from
              this campaign? The tracking link will no longer be active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeAdAccount.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={removeAdAccount.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeAdAccount.isPending ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
