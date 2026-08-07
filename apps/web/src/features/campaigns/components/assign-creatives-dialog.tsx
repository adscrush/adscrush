"use client"

import { trpc } from "@/lib/trpc/client"
import { useHasPermission } from "@/hooks/use-permission"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import { Badge } from "@adscrush/ui/components/badge"
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
import { toast } from "@adscrush/ui/sonner"
import {
  IconCheck,
  IconLoader2,
  IconPhoto,
  IconPlus,
  IconSearch,
  IconSquare,
  IconSquareCheck,
  IconSquareMinus,
} from "@tabler/icons-react"
import { cn } from "@adscrush/ui/lib/utils"
import * as React from "react"
import { useCampaignCreatives, useSyncCreatives } from "../queries"

interface AssignCreativesDialogProps {
  campaignId: string
  productId?: string | null
}

export function AssignCreativesDialog({
  campaignId,
  productId,
}: AssignCreativesDialogProps) {
  const canEdit = useHasPermission("campaigns.edit")
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const syncCreatives = useSyncCreatives()
  const { data: existingData } = useCampaignCreatives(campaignId)

  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      // Initialize selection from existing data when opening
      const ids = existingData?.data.map((c) => c.creativeId) ?? []
      setSelectedIds(ids)
    } else {
      setSearch("")
    }
  }

  const creativesQuery = trpc.creatives.list.useQuery(
    {
      page: 1,
      perPage: 100,
      search: search || undefined,
      sort: [{ id: "createdAt", desc: true }],
      productId: productId || undefined,
    },
    { enabled: open, staleTime: 30_000 }
  )

  const creatives = React.useMemo(
    () => creativesQuery.data?.items ?? [],
    [creativesQuery.data?.items]
  )

  const handleToggle = React.useCallback((creativeId: string) => {
    setSelectedIds((prev) =>
      prev.includes(creativeId)
        ? prev.filter((id) => id !== creativeId)
        : [...prev, creativeId]
    )
  }, [])

  const handleToggleAll = React.useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.length === creatives.length) {
        return []
      }
      return creatives.map((c) => c.id)
    })
  }, [creatives])

  const handleSave = () => {
    syncCreatives.mutate(
      { campaignId, creativeIds: selectedIds },
      {
        onSuccess: () => {
          toast.success("Campaign creatives updated")
          setOpen(false)
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update creatives")
        },
      }
    )
  }

  if (!canEdit) return null

  const isLoading = syncCreatives.isPending
  const allSelected = creatives.length > 0 && selectedIds.length === creatives.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < creatives.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <IconPlus className="mr-2 size-4" />
            Assign Creatives
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Assign Creatives</DialogTitle>
          <DialogDescription>
            Select creatives to link to this campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-0">
          {/* Search */}
          <div className="px-6 py-3 border-b bg-muted/30">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search creatives..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
          </div>

          {/* Select all */}
          <div
            className="flex items-center gap-3 px-6 py-3 border-b bg-muted/30 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={handleToggleAll}
          >
            {allSelected ? (
              <IconSquareCheck className="size-5 text-primary" />
            ) : someSelected ? (
              <IconSquareMinus className="size-5 text-primary" />
            ) : (
              <IconSquare className="size-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              Select all ({creatives.length})
            </span>
            {selectedIds.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {selectedIds.length} selected
              </Badge>
            )}
          </div>

          {/* Creative list */}
          <div className="overflow-y-auto max-h-[50vh]">
            {creativesQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : creatives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <IconPhoto className="mb-3 size-10 opacity-50" />
                <p className="text-sm font-medium">No creatives found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div className="divide-y">
                {creatives.map((creative) => {
                  const isSelected = selectedIds.includes(creative.id)
                  const thumbnail =
                    creative.thumbnailUrl ||
                    creative.cdnUrl ||
                    creative.files?.[0]?.thumbnailUrl ||
                    creative.files?.[0]?.cdnUrl

                  return (
                    <div
                      key={creative.id}
                      className={cn(
                        "flex items-center gap-4 px-6 py-3 cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => handleToggle(creative.id)}
                    >
                      {/* Checkbox icon */}
                      {isSelected ? (
                        <IconSquareCheck className="size-5 shrink-0 text-primary" />
                      ) : (
                        <IconSquare className="size-5 shrink-0 text-muted-foreground" />
                      )}

                      {/* Thumbnail */}
                      <div className="size-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={creative.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <IconPhoto className="size-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {creative.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {creative.mimeType && (
                            <span className="text-xs text-muted-foreground">
                              {creative.mimeType}
                            </span>
                          )}
                          {creative.fileSize && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">
                                {(creative.fileSize / 1024).toFixed(1)} KB
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status indicator */}
                      {isSelected && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <IconCheck className="size-4 text-primary" />
                          <span className="text-xs font-medium text-primary">Selected</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-muted/30">
          <DialogClose
            render={
              <Button variant="outline" disabled={isLoading} type="button">
                Cancel
              </Button>
            }
          />
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              `Save ${selectedIds.length} Creative${selectedIds.length === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
