"use client"

import * as React from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { cn } from "@adscrush/ui/lib/utils"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@adscrush/ui/components/sortable"
import { MediaFilePicker, type FileItem } from "@/components/media/media-file-picker"
import { IconGripVertical, IconPhoto, IconTrash } from "@tabler/icons-react"

const MAX_MEDIA_ITEMS = 20

export function MediaSection() {
  const { control } = useFormContext()
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "mediaItems",
  })
  const mediaItems = useWatch({ control, name: "mediaItems" }) as
    | { url: string; type: string; position: number }[]
    | undefined

  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pendingFiles, setPendingFiles] = React.useState<FileItem[]>([])

  const items = React.useMemo(() => mediaItems ?? [], [mediaItems])
  const canAddMore = items.length < MAX_MEDIA_ITEMS

  const initialSelectedIds = React.useMemo(
    () =>
      items
        .map((item) => (item as { mediaFileId?: string }).mediaFileId)
        .filter(Boolean) as string[],
    [items]
  )

  const handleSelect = React.useCallback(
    (selectedFiles: FileItem[]) => {
      setPendingFiles(selectedFiles)
    },
    []
  )

  React.useEffect(() => {
    if (!pickerOpen && pendingFiles.length > 0) {
      const existingIds = new Set(
        fields
          .map((f) => (f as { mediaFileId?: string }).mediaFileId)
          .filter(Boolean)
      )
      const newFiles = pendingFiles.filter((f) => !existingIds.has(f.id))
      if (newFiles.length > 0) {
        append(
          newFiles.map((f, i) => ({
            url: f.url,
            type: "image" as const,
            mediaFileId: f.id,
            position: fields.length + i,
          }))
        )
      }
      setPendingFiles([])
    }
    // `fields` is intentionally included: the effect recomputes the existing-ID
    // set from the latest field array before appending new files.
  }, [pickerOpen, pendingFiles, append, fields.length, fields])

  const handleRemove = React.useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation()
      remove(index)
    },
    [remove]
  )

  const handleReorder = React.useCallback(
    (reorderedFields: typeof fields) => {
      // onValueChange gives us the complete correct order from @dnd-kit.
      // Replace the entire field array with the new order (strip react-hook-form's
      // internal `id` property so replace receives plain form values).
      const newValues = reorderedFields.map(({ id: _, ...rest }) => rest)
      replace(newValues)
    },
    [replace]
  )



  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">Media</h3>
        <span className="text-xs text-muted-foreground">
          {items.length}/{MAX_MEDIA_ITEMS}
        </span>
      </div>

      {items.length > 0 ? (
        <>
          <Sortable
            value={fields}
            onValueChange={handleReorder}
            getItemValue={(item) => item.id}
            orientation="mixed"

          >
            <SortableContent className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {fields.map((field, index) => (
                <SortableItem
                  key={field.id}
                  value={field.id}
                  className="group relative aspect-square overflow-hidden rounded-md border bg-muted/20"
                >
                  <img
                    src={items[index]?.url ?? ""}
                    alt=""
                    className="pointer-events-none size-full object-cover"
                  />

                  {/* Drag handle — only this element triggers drag */}
                  <SortableItemHandle
                    className="absolute top-1 left-1 z-10 rounded bg-background/70 p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  >
                    <IconGripVertical className="size-3 text-muted-foreground" />
                  </SortableItemHandle>

                  {/* Remove button — completely separate from drag system */}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(index, e)}
                    className={cn(
                      "absolute top-1 right-1 z-10 flex size-5 items-center justify-center rounded-full",
                      "bg-background/80 text-muted-foreground shadow-sm",
                      "opacity-0 transition-opacity group-hover:opacity-100",
                      "hover:bg-destructive hover:text-destructive-foreground"
                    )}
                  >
                    <IconTrash className="size-2.5" />
                  </button>
                </SortableItem>
              ))}
              {canAddMore && (
                <div
                  onClick={() => setPickerOpen(true)}
                  className="flex aspect-square cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/10 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-accent/30"
                >
                  <IconPhoto className="size-6" />
                </div>
              )}
            </SortableContent>
            <SortableOverlay>
              {({ value }) => {
                const index = fields.findIndex((f) => f.id === value)
                const item = items[index]
                if (!item) return null
                return (
                  <div className="aspect-square overflow-hidden rounded-md border bg-muted/20 shadow-lg">
                    <img src={item.url} alt="" className="size-full object-cover" />
                  </div>
                )
              }}
            </SortableOverlay>
          </Sortable>
        </>
      ) : (
        <div
          onClick={() => canAddMore && setPickerOpen(true)}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 py-10 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-accent/30",
            canAddMore && "hover:border-muted-foreground/50 hover:bg-accent/30"
          )}
        >
          <IconPhoto className="mb-2 size-8" />
          <p className="text-xs font-medium">Click to add media</p>
          <p className="mt-0.5 text-[10px]">
            Browse media library or upload files
          </p>
        </div>
      )}

      {!canAddMore && items.length > 0 && (
        <p className="mt-3 text-xs text-amber-600">
          Maximum of {MAX_MEDIA_ITEMS} media files reached.
        </p>
      )}

      <MediaFilePicker
        accept={["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"]}
        initialSelectedIds={initialSelectedIds}
        multiple
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
      />
    </div>
  )
}
