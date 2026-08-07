"use client"

import { trpc } from "@/lib/trpc/client"
import { useHasPermission } from "@/hooks/use-permission"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adscrush/ui/components/dialog"
import { Input } from "@adscrush/ui/components/input"
import { Badge } from "@adscrush/ui/components/badge"
import { Checkbox } from "@adscrush/ui/components/checkbox"
import { ScrollArea } from "@adscrush/ui/components/scroll-area"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@adscrush/ui/components/pagination"
import { toast } from "@adscrush/ui/sonner"
import { IconLoader2, IconPlus, IconSearch } from "@tabler/icons-react"
import { cn } from "@adscrush/ui/lib/utils"
import * as React from "react"
import { useAssignAdAccount } from "../queries"

interface AssignAdAccountDialogProps {
  campaignId: string
  /** IDs of ad accounts already assigned to this campaign */
  assignedAdAccountIds?: string[]
}

const ITEMS_PER_PAGE = 25

export function AssignAdAccountDialog({
  campaignId,
  assignedAdAccountIds = [],
}: AssignAdAccountDialogProps) {
  const canEdit = useHasPermission("campaigns.edit")
  const [open, setOpen] = React.useState(false)
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  const assignMutation = useAssignAdAccount()

  /**
   * Debounce search input to avoid API calls on every keystroke.
   * Waits 400ms after user stops typing before triggering search.
   */
  const updateDebouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value)
    setCurrentPage(1) // Reset to first page on search
  }, 400)

  React.useEffect(() => {
    updateDebouncedSearch(searchInput)
  }, [searchInput, updateDebouncedSearch])

  const adAccountsQuery = trpc.adAccounts.list.useQuery(
    {
      page: currentPage,
      perPage: ITEMS_PER_PAGE,
      search: debouncedSearch || undefined,
      sort: [{ id: "name", desc: false }],
      // Only accounts with a media buyer can be assigned to a campaign
      requireMediaBuyer: true,
    },
    {
      enabled: open,
      staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    }
  )

  const adAccounts = adAccountsQuery.data?.items ?? []
  const totalPages = adAccountsQuery.data?.pageCount ?? 1
  const totalCount = adAccountsQuery.data?.total ?? 0

  const handleToggleSelection = (accountId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(accountId)) {
        next.delete(accountId)
      } else {
        next.add(accountId)
      }
      return next
    })
  }

  const handleAssignSelected = async () => {
    if (selectedIds.size === 0) return

    const selectedArray = Array.from(selectedIds)
    let successCount = 0
    let failCount = 0

    // Show loading toast for batch operation
    const loadingToast = toast.loading(
      `Assigning ${selectedArray.length} ad account${selectedArray.length > 1 ? "s" : ""}...`
    )

    // Assign accounts sequentially to avoid race conditions
    for (const adAccountId of selectedArray) {
      try {
        await assignMutation.mutateAsync({ campaignId, adAccountId })
        successCount++
      } catch {
        failCount++
      }
    }

    toast.dismiss(loadingToast)

    if (successCount > 0) {
      toast.success(
        `Successfully assigned ${successCount} ad account${successCount > 1 ? "s" : ""}`
      )
    }
    if (failCount > 0) {
      toast.error(
        `Failed to assign ${failCount} ad account${failCount > 1 ? "s" : ""}`
      )
    }

    if (failCount === 0) {
      setOpen(false)
      setSelectedIds(new Set())
      setSearchInput("")
      setDebouncedSearch("")
      setCurrentPage(1)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSelectedIds(new Set())
      setSearchInput("")
      setDebouncedSearch("")
      setCurrentPage(1)
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (!canEdit) return null

  const isLoading = assignMutation.isPending
  const availableAdAccounts = adAccounts.filter(
    (account) => !assignedAdAccountIds.includes(account.id)
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <IconPlus className="mr-2 size-4" />
            Assign Ad Account
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Assign Ad Accounts</DialogTitle>
          <DialogDescription>
            Select ad accounts to assign to this campaign. Tracking links will be
            generated automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ad accounts by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between border-y bg-muted/30 px-6 py-2 text-sm">
          <span className="text-muted-foreground">
            {adAccountsQuery.isLoading ? (
              "Loading..."
            ) : availableAdAccounts.length === 0 ? (
              "No available ad accounts"
            ) : (
              <>
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}{" "}
                ad accounts
              </>
            )}
          </span>
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="font-medium">
              {selectedIds.size} selected
            </Badge>
          )}
        </div>

        {/* Ad Accounts List */}
        <ScrollArea className="h-[400px]">
          <div className="px-6">
            {adAccountsQuery.isLoading ? (
              // Loading skeleton
              <div className="space-y-2 py-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <Skeleton className="size-4 shrink-0 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full max-w-sm" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : availableAdAccounts.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 rounded-full bg-muted p-3">
                  <IconSearch className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No ad accounts found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {searchInput
                    ? "Try adjusting your search"
                    : "All ad accounts are already assigned"}
                </p>
              </div>
            ) : (
              // Ad accounts list
              <div className="space-y-1 py-2">
                {availableAdAccounts.map((account) => {
                  const isSelected = selectedIds.has(account.id)

                  return (
                    <label
                      key={account.id}
                      htmlFor={`account-${account.id}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors hover:bg-accent",
                        isSelected && "border-primary/20 bg-primary/5"
                      )}
                    >
                      <Checkbox
                        id={`account-${account.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelection(account.id)}
                        disabled={isLoading}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-sm font-medium">
                          {account.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase"
                          >
                            {account.sourcePlatform}
                          </Badge>
                          {account.accountId && (
                            <span className="truncate text-xs text-muted-foreground">
                              {account.accountId}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && !adAccountsQuery.isLoading && (
          <div className="border-t px-6 py-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={cn(
                      currentPage === 1 &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show first page, current page, and last page
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
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
                      currentPage === totalPages &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="border-t px-6 py-4">
          <DialogClose
            render={
              <Button variant="outline" disabled={isLoading} type="button">
                Cancel
              </Button>
            }
          />
          <Button
            onClick={handleAssignSelected}
            disabled={selectedIds.size === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                Assign {selectedIds.size > 0 && `(${selectedIds.size})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
