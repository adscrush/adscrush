"use client"

import * as React from "react"
import { Button } from "@adscrush/ui/components/button"
import { Checkbox } from "@adscrush/ui/components/checkbox"
import { Badge } from "@adscrush/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adscrush/ui/components/table"
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
import { trpc } from "@/lib/trpc/client"
import { useSession } from "@/lib/auth/client"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { ROLES } from "@adscrush/shared/constants/roles"
import {
  IconSearch,
  IconTrash,
  IconLoader2,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from "@tabler/icons-react"
import { formatFileSize } from "./media-utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrphanFile {
  id: string
  name: string
  fileSize: number
  mimeType: string
  createdAt: Date
  updatedAt: Date
}

interface DeletionResult {
  id: string
  status: "deleted" | "failed"
  error?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OrphanPanel() {
  const { data: session } = useSession()
  const user = session?.user

  // Only admin/super_admin can see this panel
  const isAdmin = !!user && isAtLeastRole(user.role, ROLES.ADMIN)

  if (!isAdmin) {
    return null
  }

  return <OrphanPanelContent />
}

function OrphanPanelContent() {
  const [hasScanned, setHasScanned] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [deletionResults, setDeletionResults] = React.useState<DeletionResult[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  // Scan orphans query (enabled manually)
  const scanQuery = trpc.media.scanOrphans.useQuery(undefined, {
    enabled: false,
    retry: false,
  })

  // Delete orphans mutation
  const deleteMutation = trpc.media.deleteOrphans.useMutation({
    onSuccess: (result) => {
      const results: DeletionResult[] = []

      for (const id of result.deleted) {
        results.push({ id, status: "deleted" })
      }
      for (const item of result.failed) {
        results.push({ id: item.id, status: "failed", error: item.error })
      }

      setDeletionResults(results)
      setSelectedIds(new Set())

      const deletedCount = result.deleted.length
      const failedCount = result.failed.length

      if (failedCount === 0) {
        toast.success(`${deletedCount} file${deletedCount !== 1 ? "s" : ""} deleted successfully`)
      } else {
        toast.warning(
          `${deletedCount} deleted, ${failedCount} failed. Failed files remain for retry.`,
        )
      }

      // Re-fetch to update the list (remove deleted files)
      void scanQuery.refetch()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete orphans")
    },
  })

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleScan = async () => {
    setHasScanned(true)
    setDeletionResults([])
    setSelectedIds(new Set())
    await scanQuery.refetch()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && orphans.length > 0) {
      setSelectedIds(new Set(orphans.map((f) => f.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const handleDeleteSelected = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    setShowDeleteConfirm(false)
    setDeletionResults([])
    deleteMutation.mutate({ fileIds: Array.from(selectedIds) })
  }

  // ─── Derived State ───────────────────────────────────────────────────────

  const orphans: OrphanFile[] = React.useMemo(() => {
    if (!scanQuery.data?.orphans) return []
    return scanQuery.data.orphans.map((f) => ({
      id: f.id,
      name: f.name,
      fileSize: f.fileSize,
      mimeType: f.mimeType,
      createdAt: new Date(f.createdAt),
      updatedAt: new Date(f.updatedAt),
    }))
  }, [scanQuery.data])

  const totalScanned = scanQuery.data?.totalScanned ?? 0
  const isScanning = scanQuery.isFetching
  const isDeleting = deleteMutation.isPending
  const allSelected = orphans.length > 0 && selectedIds.size === orphans.length

  // Get deletion result for a specific file
  const getResultForFile = (id: string): DeletionResult | undefined => {
    return deletionResults.find((r) => r.id === id)
  }

  // Filter out successfully deleted files from the display
  const displayOrphans = React.useMemo(() => {
    const deletedIds = new Set(
      deletionResults.filter((r) => r.status === "deleted").map((r) => r.id),
    )
    return orphans.filter((f) => !deletedIds.has(f.id))
  }, [orphans, deletionResults])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Orphan Detection</h3>
          <p className="text-sm text-muted-foreground">
            Find and clean up files with no usage references
          </p>
        </div>
        <Button onClick={handleScan} disabled={isScanning || isDeleting}>
          {isScanning ? (
            <IconLoader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <IconSearch className="mr-2 size-4" />
          )}
          {isScanning ? "Scanning..." : "Scan for Orphans"}
        </Button>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
          <IconLoader2 className="size-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Scanning media files...</p>
            <p className="text-xs text-muted-foreground">
              Checking usage references for all files
            </p>
          </div>
        </div>
      )}

      {/* Scan Results */}
      {hasScanned && !isScanning && scanQuery.data && (
        <div className="flex flex-col gap-3">
          {/* Summary */}
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="secondary">{totalScanned} files scanned</Badge>
            <Badge variant={displayOrphans.length > 0 ? "destructive" : "default"}>
              {displayOrphans.length} orphan{displayOrphans.length !== 1 ? "s" : ""} found
            </Badge>
          </div>

          {/* Orphan List */}
          {displayOrphans.length > 0 && (
            <>
              {/* Bulk Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0 || isDeleting}
                >
                  {isDeleting ? (
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <IconTrash className="mr-2 size-4" />
                  )}
                  {isDeleting
                    ? "Deleting..."
                    : `Delete Selected (${selectedIds.size})`}
                </Button>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all orphans"
                        />
                      </TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead className="w-28">Size</TableHead>
                      <TableHead className="w-36">MIME Type</TableHead>
                      <TableHead className="w-40">Last Modified</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayOrphans.map((file) => {
                      const result = getResultForFile(file.id)
                      return (
                        <TableRow key={file.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(file.id)}
                              onCheckedChange={(checked) =>
                                handleSelectOne(file.id, !!checked)
                              }
                              aria-label={`Select ${file.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="truncate text-sm font-medium">
                              {file.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatFileSize(file.fileSize)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {file.mimeType}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(file.updatedAt)}
                          </TableCell>
                          <TableCell>
                            {result?.status === "failed" && (
                              <div className="flex items-center gap-1">
                                <IconX className="size-4 text-destructive" />
                                <span
                                  className="text-xs text-destructive"
                                  title={result.error}
                                >
                                  Failed
                                </span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Deletion Results Summary */}
              {deletionResults.length > 0 && (
                <DeletionResultsSummary results={deletionResults} />
              )}
            </>
          )}

          {/* Empty State */}
          {displayOrphans.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
              <IconCheck className="mb-2 size-8 text-green-600" />
              <p className="text-sm font-medium">No orphaned files found</p>
              <p className="text-xs text-muted-foreground">
                All media files have active usage references
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {hasScanned && !isScanning && scanQuery.isError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <IconAlertTriangle className="size-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Scan failed</p>
            <p className="text-xs text-muted-foreground">
              {scanQuery.error?.message || "An error occurred while scanning"}
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={handleScan}>
            Retry
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete orphaned files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedIds.size} orphaned file
              {selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone. Files will
              be removed from both storage and the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedIds.size} file{selectedIds.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Deletion Results Summary ────────────────────────────────────────────────

function DeletionResultsSummary({ results }: { results: DeletionResult[] }) {
  const deletedCount = results.filter((r) => r.status === "deleted").length
  const failedCount = results.filter((r) => r.status === "failed").length
  const failedItems = results.filter((r) => r.status === "failed")

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-4 text-sm">
        {deletedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <IconCheck className="size-4 text-green-600" />
            <span>
              {deletedCount} file{deletedCount !== 1 ? "s" : ""} deleted
            </span>
          </div>
        )}
        {failedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <IconX className="size-4 text-destructive" />
            <span>
              {failedCount} file{failedCount !== 1 ? "s" : ""} failed
            </span>
          </div>
        )}
      </div>

      {/* Per-file error details */}
      {failedItems.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">Failure details:</p>
          {failedItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs">
              <IconAlertTriangle className="size-3 shrink-0 text-destructive" />
              <span className="truncate text-muted-foreground">
                {item.id}: {item.error || "Unknown error"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}
