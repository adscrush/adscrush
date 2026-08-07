"use client"

import * as React from "react"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@adscrush/ui/components/context-menu"
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
import { cn } from "@adscrush/ui/lib/utils"
import { toast } from "@adscrush/ui/sonner"
import { trpc } from "@/lib/trpc/client"
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Loader,
  Pencil,
  Trash2,
  FolderInput,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface FolderTreeProps {
  selectedFolderId: string | null
  onSelectFolder: (folderId: string | null) => void
}

interface FolderNode {
  id: string
  name: string
  parentId: string | null
  depth: number
  fileCount: number
  children: FolderNode[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTree(
  folders: Array<{
    id: string
    name: string
    parentId: string | null
    depth: number
    fileCount: number
  }>
): FolderNode[] {
  const map = new Map<string, FolderNode>()
  const roots: FolderNode[] = []

  // Create nodes
  for (const folder of folders) {
    map.set(folder.id, { ...folder, children: [] })
  }

  // Build hierarchy
  for (const folder of folders) {
    const node = map.get(folder.id)!
    if (folder.parentId && map.has(folder.parentId)) {
      map.get(folder.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FolderTree({ selectedFolderId, onSelectFolder }: FolderTreeProps) {
  const utils = trpc.useUtils()

  // Fetch all folders (no parentId filter = get all)
  const { data: folders, isLoading } = trpc.mediaFolders.list.useQuery(undefined)

  const createFolder = trpc.mediaFolders.create.useMutation({
    onSuccess: () => {
      utils.mediaFolders.list.invalidate()
      toast.success("Folder created")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const renameFolder = trpc.mediaFolders.rename.useMutation({
    onSuccess: () => {
      utils.mediaFolders.list.invalidate()
      toast.success("Folder renamed")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const moveFolder = trpc.mediaFolders.move.useMutation({
    onSuccess: () => {
      utils.mediaFolders.list.invalidate()
      toast.success("Folder moved")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const moveFiles = trpc.media.moveFiles.useMutation({
    onSuccess: (data) => {
      utils.media.list.invalidate()
      utils.mediaFolders.list.invalidate()
      utils.mediaFolders.listChildren.invalidate()
      if (data.failureCount > 0) {
        toast.error(
          `Moved ${data.successCount} file${data.successCount !== 1 ? "s" : ""}, ${data.failureCount} failed`
        )
      } else {
        toast.success(
          `Moved ${data.successCount} file${data.successCount !== 1 ? "s" : ""} to folder`
        )
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to move files")
    },
  })

  const deleteFolder = trpc.mediaFolders.delete.useMutation({
    onSuccess: (data) => {
      utils.mediaFolders.list.invalidate()
      utils.mediaFolders.listChildren.invalidate()
      utils.media.list.invalidate()
      if (data.reparentedCount > 0) {
        toast.success(
          `Folder deleted. ${data.reparentedCount} item${data.reparentedCount !== 1 ? "s" : ""} moved to parent folder.`
        )
      } else {
        toast.success("Folder deleted")
      }
    },
    onError: (error) => {
      if (error.data?.code === "NOT_FOUND") {
        toast.error("Folder not found. Refreshing folder tree.")
        utils.mediaFolders.list.invalidate()
      } else {
        toast.error(error.message)
      }
    },
  })

  // State
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())
  const [creatingInParent, setCreatingInParent] = React.useState<string | null | undefined>(undefined)
  const [renamingId, setRenamingId] = React.useState<string | null>(null)
  const [deletingFolder, setDeletingFolder] = React.useState<FolderNode | null>(null)
  const [movingFolder, setMovingFolder] = React.useState<FolderNode | null>(null)

  const tree = React.useMemo(() => {
    if (!folders) return []
    return buildTree(folders)
  }, [folders])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCreateFolder = (name: string, parentId: string | null) => {
    if (!name.trim()) {
      setCreatingInParent(undefined)
      return
    }
    createFolder.mutate(
      { name: name.trim(), parentId },
      {
        onSuccess: () => {
          setCreatingInParent(undefined)
          if (parentId) {
            setExpandedIds((prev) => new Set([...prev, parentId]))
          }
        },
      }
    )
  }

  const handleRename = (folderId: string, name: string) => {
    if (!name.trim()) {
      setRenamingId(null)
      return
    }
    renameFolder.mutate(
      { folderId, name: name.trim() },
      { onSettled: () => setRenamingId(null) }
    )
  }

  const handleDelete = () => {
    if (!deletingFolder) return
    const folderToDelete = deletingFolder
    deleteFolder.mutate(
      { folderId: folderToDelete.id },
      {
        onSuccess: () => {
          if (selectedFolderId === folderToDelete.id) {
            onSelectFolder(folderToDelete.parentId)
          }
          setDeletingFolder(null)
        },
        onError: () => {
          setDeletingFolder(null)
        },
      }
    )
  }

  const handleMoveToRoot = () => {
    if (!movingFolder) return
    moveFolder.mutate(
      { folderId: movingFolder.id, newParentId: null },
      { onSettled: () => setMovingFolder(null) }
    )
  }

  const handleFileDrop = (fileIds: string[], targetFolderId: string | null) => {
    if (fileIds.length === 0) return
    moveFiles.mutate({ fileIds, targetFolderId })
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Folders
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => setCreatingInParent(null)}
          title="New folder"
        >
          <FolderPlus className="size-3.5" />
        </Button>
      </div>

      {/* All Files (root) */}
      <button
        type="button"
        onClick={() => onSelectFolder(null)}
        className={cn(
          "flex w-full items-center gap-2 px-2 py-1 text-xs transition-colors hover:bg-accent",
          selectedFolderId === null &&
            "bg-primary/10 text-primary font-medium border-l-2 border-primary"
        )}
      >
        <Folder className="size-3.5 shrink-0" />
        <span className="truncate">All Files</span>
      </button>

      {/* Tree */}
      <div className="flex flex-col gap-0.5">
        {tree.map((node) => (
          <FolderTreeItem
            key={node.id}
            node={node}
            depth={0}
            selectedFolderId={selectedFolderId}
            expandedIds={expandedIds}
            renamingId={renamingId}
            creatingInParent={creatingInParent}
            onSelect={onSelectFolder}
            onToggleExpand={toggleExpand}
            onStartRename={setRenamingId}
            onRename={handleRename}
            onDelete={setDeletingFolder}
            onMove={setMovingFolder}
            onCreateChild={(parentId) => {
              setCreatingInParent(parentId)
              setExpandedIds((prev) => new Set([...prev, parentId]))
            }}
            onCreateFolder={handleCreateFolder}
            onCancelCreate={() => setCreatingInParent(undefined)}
            onFileDrop={handleFileDrop}
          />
        ))}
      </div>

      {/* Inline create at root level */}
      {creatingInParent === null && (
        <InlineInput
          placeholder="Folder name..."
          onSubmit={(name) => handleCreateFolder(name, null)}
          onCancel={() => setCreatingInParent(undefined)}
          depth={0}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deletingFolder !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingFolder(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete &ldquo;{deletingFolder?.name}&rdquo;?
                </p>
                {deletingFolder && (deletingFolder.fileCount > 0 || deletingFolder.children.length > 0) && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="font-medium">This folder contains:</p>
                    <ul className="mt-1 list-inside list-disc">
                      {deletingFolder.fileCount > 0 && (
                        <li>{deletingFolder.fileCount} file{deletingFolder.fileCount !== 1 ? "s" : ""}</li>
                      )}
                      {deletingFolder.children.length > 0 && (
                        <li>{deletingFolder.children.length} subfolder{deletingFolder.children.length !== 1 ? "s" : ""}</li>
                      )}
                    </ul>
                    <p className="mt-2">
                      These items will be moved to {deletingFolder.parentId ? "the parent folder" : "the root level"}.
                    </p>
                  </div>
                )}
                {deletingFolder && deletingFolder.fileCount === 0 && deletingFolder.children.length === 0 && (
                  <p className="text-muted-foreground">This folder is empty.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFolder.isPending && (
                <Loader className="mr-2 size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move to root dialog */}
      <AlertDialog
        open={movingFolder !== null}
        onOpenChange={(open) => {
          if (!open) setMovingFolder(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move folder</AlertDialogTitle>
            <AlertDialogDescription>
              Move &ldquo;{movingFolder?.name}&rdquo; to the root level?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMoveToRoot}>
              {moveFolder.isPending && (
                <Loader className="mr-2 size-4 animate-spin" />
              )}
              Move to root
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Tree Item ─────────────────────────────────────────────────────────────────

interface FolderTreeItemProps {
  node: FolderNode
  depth: number
  selectedFolderId: string | null
  expandedIds: Set<string>
  renamingId: string | null
  creatingInParent: string | null | undefined
  onSelect: (folderId: string | null) => void
  onToggleExpand: (id: string) => void
  onStartRename: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (node: FolderNode) => void
  onMove: (node: FolderNode) => void
  onCreateChild: (parentId: string) => void
  onCreateFolder: (name: string, parentId: string | null) => void
  onCancelCreate: () => void
  onFileDrop: (fileIds: string[], targetFolderId: string | null) => void
}

function FolderTreeItem({
  node,
  depth,
  selectedFolderId,
  expandedIds,
  renamingId,
  creatingInParent,
  onSelect,
  onToggleExpand,
  onStartRename,
  onRename,
  onDelete,
  onMove,
  onCreateChild,
  onCreateFolder,
  onCancelCreate,
  onFileDrop,
}: FolderTreeItemProps) {
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedFolderId === node.id
  const hasChildren = node.children.length > 0
  const isRenaming = renamingId === node.id
  const isCreatingHere = creatingInParent === node.id
  const [isDragOver, setIsDragOver] = React.useState(false)
  const dragCounterRef = React.useRef(0)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragOver(false)

    const data = e.dataTransfer.getData("application/x-media-file-ids")
    if (!data) return

    try {
      const fileIds: string[] = JSON.parse(data)
      if (Array.isArray(fileIds) && fileIds.length > 0) {
        onFileDrop(fileIds, node.id)
      }
    } catch {
      // Invalid data format, ignore
    }
  }

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group flex w-full items-center gap-1 py-1 pr-2 text-xs transition-colors hover:bg-accent cursor-pointer",
              isSelected && "bg-primary/10 text-primary font-medium border-l-2 border-primary",
              isDragOver && "bg-primary/10 ring-2 ring-primary/50"
            )}
            style={{ paddingLeft: `${(depth * 12) + 8}px` }}
            onClick={() => onSelect(node.id)}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Expand/collapse arrow */}
            <button
              type="button"
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-sm hover:bg-accent-foreground/10",
                !hasChildren && "invisible"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(node.id)
              }}
            >
                <ChevronRight
                  className={cn(
                    "size-2.5 transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )}
                />
            </button>

            {/* Folder icon */}
            {isExpanded ? (
              <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="size-3.5 shrink-0 text-muted-foreground" />
            )}

            {/* Name or rename input */}
            {isRenaming ? (
              <InlineInput
                defaultValue={node.name}
                placeholder="Folder name..."
                onSubmit={(name) => onRename(node.id, name)}
                onCancel={() => onStartRename("")}
                depth={0}
                inline
              />
            ) : (
              <span className="truncate flex-1">{node.name}</span>
            )}

            {/* Hover-reveal create subfolder button */}
            {!isRenaming && (
              <button
                type="button"
                className="ml-auto shrink-0 size-5 items-center justify-center rounded-sm hover:bg-accent-foreground/10 hidden group-hover:flex"
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateChild(node.id)
                }}
                title="Create subfolder"
              >
                <FolderPlus className="size-3" />
              </button>
            )}

            {/* File count badge */}
            {!isRenaming && node.fileCount > 0 && (
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums group-hover:hidden">
                {node.fileCount}
              </span>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onCreateChild(node.id)}>
            <FolderPlus className="mr-2 size-4" />
            New subfolder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onStartRename(node.id)}>
            <Pencil className="mr-2 size-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onMove(node)}>
            <FolderInput className="mr-2 size-4" />
            Move to root
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => onDelete(node)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Children with expand/collapse transition */}
      {hasChildren && (
        <div
          className="grid transition-[grid-template-rows] duration-200 ease-in-out"
          style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            {node.children.map((child) => (
              <FolderTreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedFolderId={selectedFolderId}
                expandedIds={expandedIds}
                renamingId={renamingId}
                creatingInParent={creatingInParent}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
                onStartRename={onStartRename}
                onRename={onRename}
                onDelete={onDelete}
                onMove={onMove}
                onCreateChild={onCreateChild}
                onCreateFolder={onCreateFolder}
                onCancelCreate={onCancelCreate}
                onFileDrop={onFileDrop}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inline create for child folder */}
      {isCreatingHere && (
        <InlineInput
          placeholder="Folder name..."
          onSubmit={(name) => onCreateFolder(name, node.id)}
          onCancel={onCancelCreate}
          depth={depth + 1}
        />
      )}
    </div>
  )
}

// ─── Inline Input ──────────────────────────────────────────────────────────────

interface InlineInputProps {
  defaultValue?: string
  placeholder?: string
  onSubmit: (value: string) => void
  onCancel: () => void
  depth: number
  inline?: boolean
}

function InlineInput({
  defaultValue = "",
  placeholder,
  onSubmit,
  onCancel,
  depth,
  inline,
}: InlineInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [value, setValue] = React.useState(defaultValue)

  React.useEffect(() => {
    // Focus and select on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onSubmit(value)
    } else if (e.key === "Escape") {
      e.preventDefault()
      onCancel()
    }
  }

  if (inline) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSubmit(value)}
        placeholder={placeholder}
        className="h-5 flex-1 text-xs px-1"
      />
    )
  }

  return (
    <div
      className="flex items-center gap-1 py-1 pr-2"
      style={{ paddingLeft: `${(depth * 12) + 8 + 4 + 16}px` }}
    >
      <Folder className="size-3.5 shrink-0 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (value.trim()) {
            onSubmit(value)
          } else {
            onCancel()
          }
        }}
        placeholder={placeholder}
        className="h-5 flex-1 text-xs px-1"
      />
    </div>
  )
}
