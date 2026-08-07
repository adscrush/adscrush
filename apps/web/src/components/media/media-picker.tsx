"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@adscrush/ui/components/dialog"
import { Input } from "@adscrush/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adscrush/ui/components/select"
import { ScrollArea } from "@adscrush/ui/components/scroll-area"
import { Label } from "@adscrush/ui/components/label"
import { Search, Image, FileText, Film, Type, Check } from "lucide-react"
import { IconLoader2 } from "@tabler/icons-react"
import { trpc } from "@/lib/trpc/client"
import {
  TRANSFORM_PRESETS,
  MIME_CATEGORIES,
  type TransformPreset,
  type MimeCategory,
} from "@adscrush/shared/validators/media.schema"
import { formatFileSize } from "./media-utils"
import type { MediaFile } from "@adscrush/db/schema"

// ─── Types ───────────────────────────────────────────────────────────────────

interface MediaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (file: MediaFile, transformUrl?: string) => void
  accept?: string[] // MIME type filter
  multiple?: boolean
}

type TransformMode = "crop" | "stretch" | "contain" | "cover"

interface TransformOptions {
  width?: number
  height?: number
  mode?: TransformMode
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESET_LABELS: Record<TransformPreset, string> = {
  thumbnail: "Thumbnail (150×150)",
  small: "Small (300×300)",
  medium: "Medium (600×600)",
  large: "Large (1200×1200)",
  original: "Original",
}

const MODE_TO_BUNNY_PARAM: Record<TransformMode, string> = {
  crop: "crop",
  stretch: "stretch",
  contain: "contain",
  cover: "cover",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTransformUrl(cdnUrl: string, options: TransformOptions): string {
  const params = new URLSearchParams()

  if (options.width !== undefined) {
    params.set("width", String(options.width))
  }
  if (options.height !== undefined) {
    params.set("height", String(options.height))
  }
  if (options.mode !== undefined) {
    params.set("aspect_ratio", MODE_TO_BUNNY_PARAM[options.mode])
  }

  const queryString = params.toString()
  if (!queryString) return cdnUrl

  const separator = cdnUrl.includes("?") ? "&" : "?"
  return `${cdnUrl}${separator}${queryString}`
}

function buildPresetUrl(cdnUrl: string, preset: TransformPreset): string {
  const presetOptions = TRANSFORM_PRESETS[preset]
  if (!presetOptions || Object.keys(presetOptions).length === 0) {
    return cdnUrl
  }
  return buildTransformUrl(cdnUrl, presetOptions as TransformOptions)
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/")
}

function getMimeCategoryFromAccept(accept?: string[]): MimeCategory | undefined {
  if (!accept || accept.length === 0) return undefined

  // Check if all accepted types belong to a single category
  for (const [category, mimeTypes] of Object.entries(MIME_CATEGORIES)) {
    if (accept.every((type) => (mimeTypes as readonly string[]).includes(type))) {
      return category as MimeCategory
    }
  }
  return undefined
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image
  if (mimeType.startsWith("video/")) return Film
  if (mimeType.startsWith("font/")) return Type
  return FileText
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  accept,
  multiple: _multiple,
}: MediaPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [mimeCategory, setMimeCategory] = useState<MimeCategory | "all">("all")
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<TransformPreset>("original")
  const [customWidth, setCustomWidth] = useState("")
  const [customHeight, setCustomHeight] = useState("")
  const [customMode, setCustomMode] = useState<TransformMode>("contain")
  const [useCustom, setUseCustom] = useState(false)

  // Determine the effective MIME category filter
  const effectiveMimeCategory = useMemo(() => {
    if (mimeCategory !== "all") return mimeCategory
    return getMimeCategoryFromAccept(accept)
  }, [mimeCategory, accept])

  // Fetch media files
  const { data, isLoading } = trpc.media.list.useQuery(
    {
      pageSize: 50,
      search: searchQuery || undefined,
      mimeCategory: effectiveMimeCategory,
      sortBy: "dateUploaded",
      sortOrder: "desc",
    },
    { enabled: open },
  )

  const files = useMemo(() => data?.items ?? [], [data?.items])

  // Filter by accepted MIME types if provided
  const filteredFiles = useMemo(() => {
    if (!accept || accept.length === 0) return files
    return files.filter((file) => accept.includes(file.mimeType))
  }, [files, accept])

  const handleFileSelect = useCallback((file: MediaFile) => {
    if (isImageMimeType(file.mimeType)) {
      setSelectedFile(file)
      setSelectedPreset("original")
      setCustomWidth("")
      setCustomHeight("")
      setUseCustom(false)
    } else {
      // Non-image files: directly call onSelect
      onSelect(file)
      onOpenChange(false)
      resetState()
    }
  }, [onSelect, onOpenChange])

  const handleConfirmSelection = useCallback(() => {
    if (!selectedFile || !selectedFile.cdnUrl) return

    let transformUrl: string | undefined

    if (useCustom) {
      const w = customWidth ? parseInt(customWidth, 10) : undefined
      const h = customHeight ? parseInt(customHeight, 10) : undefined

      if ((w && (w < 1 || w > 5000)) || (h && (h < 1 || h > 5000))) {
        return // Invalid dimensions, don't proceed
      }

      if (w || h) {
        transformUrl = buildTransformUrl(selectedFile.cdnUrl, {
          width: w,
          height: h,
          mode: customMode,
        })
      }
    } else if (selectedPreset !== "original") {
      transformUrl = buildPresetUrl(selectedFile.cdnUrl, selectedPreset)
    }

    onSelect(selectedFile, transformUrl)
    onOpenChange(false)
    resetState()
  }, [selectedFile, useCustom, customWidth, customHeight, customMode, selectedPreset, onSelect, onOpenChange])

  function resetState() {
    setSelectedFile(null)
    setSearchQuery("")
    setMimeCategory("all")
    setSelectedPreset("original")
    setCustomWidth("")
    setCustomHeight("")
    setUseCustom(false)
  }

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen)
    if (!newOpen) {
      resetState()
    }
  }

  const isCustomValid = useMemo(() => {
    if (!useCustom) return true
    const w = customWidth ? parseInt(customWidth, 10) : undefined
    const h = customHeight ? parseInt(customHeight, 10) : undefined
    if (w !== undefined && (isNaN(w) || w < 1 || w > 5000)) return false
    if (h !== undefined && (isNaN(h) || h < 1 || h > 5000)) return false
    return true
  }, [useCustom, customWidth, customHeight])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>
            {selectedFile ? "Select Transformation" : "Select Media"}
          </DialogTitle>
        </DialogHeader>

        {selectedFile ? (
          // ─── Transformation Panel ──────────────────────────────────────
          <TransformationPanel
            file={selectedFile}
            selectedPreset={selectedPreset}
            onPresetChange={setSelectedPreset}
            useCustom={useCustom}
            onUseCustomChange={setUseCustom}
            customWidth={customWidth}
            onCustomWidthChange={setCustomWidth}
            customHeight={customHeight}
            onCustomHeightChange={setCustomHeight}
            customMode={customMode}
            onCustomModeChange={setCustomMode}
            isCustomValid={isCustomValid}
          />
        ) : (
          // ─── Media Grid ────────────────────────────────────────────────
          <>
            {/* Search and Filter Controls */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={mimeCategory}
                onValueChange={(value) => setMimeCategory(value as MimeCategory | "all")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="File type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="font">Fonts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Grid */}
            <ScrollArea className="flex-1 min-h-[300px]">
              {isLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No files match your search"
                      : "No media files available"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 p-1 sm:grid-cols-5 md:grid-cols-6">
                  {filteredFiles.map((file) => (
                    <MediaFileCard
                      key={file.id}
                      file={file}
                      onSelect={handleFileSelect}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        {/* Footer */}
        {selectedFile && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedFile(null)}
            >
              Back
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={!isCustomValid}
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm Selection
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Media File Card ─────────────────────────────────────────────────────────

interface MediaFileCardProps {
  file: MediaFile
  onSelect: (file: MediaFile) => void
}

function MediaFileCard({ file, onSelect }: MediaFileCardProps) {
  const isImage = isImageMimeType(file.mimeType)
  const FileIcon = getFileIcon(file.mimeType)

  return (
    <button
      type="button"
      className="group flex flex-col items-center gap-1.5 rounded-lg border p-2 text-left transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onSelect(file)}
    >
      {/* Thumbnail */}
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-muted">
        {isImage && file.cdnUrl ? (
          <img
            src={`${file.cdnUrl}?width=150&height=150&aspect_ratio=crop`}
            alt={file.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <FileIcon className="size-8 text-muted-foreground" />
        )}
      </div>

      {/* File Name */}
      <span className="w-full truncate text-center text-xs text-muted-foreground">
        {file.name}
      </span>
    </button>
  )
}

// ─── Transformation Panel ────────────────────────────────────────────────────

interface TransformationPanelProps {
  file: MediaFile
  selectedPreset: TransformPreset
  onPresetChange: (preset: TransformPreset) => void
  useCustom: boolean
  onUseCustomChange: (useCustom: boolean) => void
  customWidth: string
  onCustomWidthChange: (width: string) => void
  customHeight: string
  onCustomHeightChange: (height: string) => void
  customMode: TransformMode
  onCustomModeChange: (mode: TransformMode) => void
  isCustomValid: boolean
}

function TransformationPanel({
  file,
  selectedPreset,
  onPresetChange,
  useCustom,
  onUseCustomChange,
  customWidth,
  onCustomWidthChange,
  customHeight,
  onCustomHeightChange,
  customMode,
  onCustomModeChange,
  isCustomValid,
}: TransformationPanelProps) {
  return (
    <div className="flex flex-1 gap-6 overflow-hidden">
      {/* Preview */}
      <div className="flex flex-1 items-center justify-center rounded-lg border bg-muted/50 p-4">
        {file.cdnUrl ? (
          <img
            src={file.cdnUrl}
            alt={file.name}
            className="max-h-[300px] max-w-full rounded object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Image className="size-12" />
            <span className="text-sm">No preview available</span>
          </div>
        )}
      </div>

      {/* Transform Options */}
      <div className="flex w-[260px] shrink-0 flex-col gap-4">
        {/* File Info */}
        <div className="rounded-md border p-3">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {file.width && file.height
              ? `${file.width}×${file.height} · `
              : ""}
            {formatFileSize(file.fileSize)}
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Presets</Label>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(TRANSFORM_PRESETS) as TransformPreset[]).map((preset) => (
              <Button
                key={preset}
                variant={!useCustom && selectedPreset === preset ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  onPresetChange(preset)
                  onUseCustomChange(false)
                }}
              >
                {PRESET_LABELS[preset]}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Dimensions */}
        <div className="flex flex-col gap-2">
          <Button
            variant={useCustom ? "default" : "outline"}
            size="sm"
            className="justify-start"
            onClick={() => onUseCustomChange(true)}
          >
            Custom Dimensions
          </Button>

          {useCustom && (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor="custom-width" className="text-xs">
                    Width
                  </Label>
                  <Input
                    id="custom-width"
                    type="number"
                    min={1}
                    max={5000}
                    placeholder="px"
                    value={customWidth}
                    onChange={(e) => onCustomWidthChange(e.target.value)}
                    className="h-8"
                  />
                </div>
                <span className="mt-5 text-muted-foreground">×</span>
                <div className="flex-1">
                  <Label htmlFor="custom-height" className="text-xs">
                    Height
                  </Label>
                  <Input
                    id="custom-height"
                    type="number"
                    min={1}
                    max={5000}
                    placeholder="px"
                    value={customHeight}
                    onChange={(e) => onCustomHeightChange(e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="custom-mode" className="text-xs">
                  Mode
                </Label>
                <Select
                  value={customMode}
                  onValueChange={(value) => onCustomModeChange(value as TransformMode)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crop">Crop</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="stretch">Stretch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isCustomValid && (
                <p className="text-xs text-destructive">
                  Dimensions must be between 1 and 5000 pixels
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
