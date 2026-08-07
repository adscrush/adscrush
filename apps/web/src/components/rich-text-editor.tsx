"use client"

import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import { Label } from "@adscrush/ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@adscrush/ui/components/popover"
import { Separator } from "@adscrush/ui/components/separator"
import { Toggle } from "@adscrush/ui/components/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@adscrush/ui/components/tooltip"
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconList,
  IconListNumbers,
  IconLink,
  IconChevronDown,
} from "@tabler/icons-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  minHeight?: string
}

type HeadingLevel = "h2" | "h3" | "h4"

const HEADING_LABELS: Record<HeadingLevel, string> = {
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
}

function isEditorEmpty(el: HTMLElement): boolean {
  const html = el.innerHTML
  return !html || html === "<br>" || html === "<br/>" || html === ""
}

function getClosestBlock(node: Node | null): string | null {
  if (!node) return null
  const el = node.nodeType === 1 ? (node as HTMLElement) : node.parentElement
  const block = el?.closest("h2, h3, h4, p")
  return block ? block.tagName.toLowerCase() : null
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  maxLength,
  disabled = false,
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const skipSyncRef = useRef(false)
  const [isFocused, setIsFocused] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [activeHeading, setActiveHeading] = useState<HeadingLevel | null>(null)
  const [activeBold, setActiveBold] = useState(false)
  const [activeItalic, setActiveItalic] = useState(false)
  const [activeUnderline, setActiveUnderline] = useState(false)
  const [activeBulletList, setActiveBulletList] = useState(false)
  const [activeOrderedList, setActiveOrderedList] = useState(false)
  const [charCount, setCharCount] = useState(0)

  const readFormatState = useCallback(() => {
    setActiveBold(document.queryCommandState("bold"))
    setActiveItalic(document.queryCommandState("italic"))
    setActiveUnderline(document.queryCommandState("underline"))
    setActiveBulletList(document.queryCommandState("insertUnorderedList"))
    setActiveOrderedList(document.queryCommandState("insertOrderedList"))
    const sel = window.getSelection()
    const block = getClosestBlock(sel?.getRangeAt(0)?.startContainer ?? null)
    if (block && (block === "h2" || block === "h3" || block === "h4")) {
      setActiveHeading(block as HeadingLevel)
    } else {
      setActiveHeading(null)
    }
  }, [])

  const emitChange = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const text = editor.textContent || ""
    setCharCount(text.length)
    const html = isEditorEmpty(editor) ? "" : editor.innerHTML
    onChange(html)
  }, [onChange])

  // Set initial HTML on mount only — external `value` changes are handled by
  // the dedicated sync effect below (which respects the skipSyncRef flag).
  useEffect(() => {
    const editor = editorRef.current
    if (editor && isEditorEmpty(editor)) {
      editor.innerHTML = value || ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external value — skip when we just emitted a change ourselves
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    if (skipSyncRef.current) {
      skipSyncRef.current = false
      return
    }

    if (editor.innerHTML !== value) {
      editor.innerHTML = value || ""
    }
  }, [value])

  const exec = useCallback(
    (command: string, value?: string) => {
      if (disabled) return
      document.execCommand(command, false, value)
      skipSyncRef.current = true
      readFormatState()
      emitChange()
    },
    [disabled, readFormatState, emitChange]
  )

  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
  }, [])

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !savedRangeRef.current) return
    editor.focus()
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current)
    }
    savedRangeRef.current = null
  }, [])

  const handleToolAction = useCallback(
    (command: string, value?: string) => (e: PointerEvent) => {
      e.preventDefault()
      exec(command, value)
    },
    [exec]
  )

  const handleHeading = useCallback(
    (level: HeadingLevel) => {
      restoreSelection()
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const block = getClosestBlock(sel.getRangeAt(0).startContainer)
        if (block === level) {
          exec("formatBlock", "<p>")
        } else {
          exec("formatBlock", `<${level}>`)
        }
      } else {
        exec("formatBlock", `<${level}>`)
      }
    },
    [exec, restoreSelection]
  )

  const handleInsertLink = useCallback(() => {
    if (!linkUrl) return
    restoreSelection()
    exec("createLink", linkUrl)
    setLinkUrl("")
    setLinkPopoverOpen(false)
  }, [exec, linkUrl, restoreSelection])

  const handleInput = useCallback(() => {
    skipSyncRef.current = true
    emitChange()
  }, [emitChange])

  const handleBlur = useCallback(() => {
    skipSyncRef.current = true
    setIsFocused(false)
    readFormatState()
    emitChange()
  }, [readFormatState, emitChange])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const parent = sel.getRangeAt(0).startContainer.parentElement
          if (parent?.closest("li")) return
        }
      }
    },
    []
  )

  const showPlaceholder = !value || value === "<br>"

  return (
    <div
      className={`rounded-lg border bg-card ${
        isFocused ? "ring-1 ring-ring" : ""
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* Toolbar */}
      <div className="border-b p-2">
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-0.5">
            <HeadingDropdown
              activeHeading={activeHeading}
              onSelect={handleHeading}
              onOpen={saveSelection}
              disabled={disabled}
            />

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={activeBold}
                  onPointerDown={handleToolAction("bold")}
                  aria-label="Bold"
                  disabled={disabled}
                >
                  <IconBold className="size-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={activeItalic}
                  onPointerDown={handleToolAction("italic")}
                  aria-label="Italic"
                  disabled={disabled}
                >
                  <IconItalic className="size-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={activeUnderline}
                  onPointerDown={handleToolAction("underline")}
                  aria-label="Underline"
                  disabled={disabled}
                >
                  <IconUnderline className="size-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Underline</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={activeBulletList}
                  onPointerDown={handleToolAction("insertUnorderedList")}
                  aria-label="Bullet list"
                  disabled={disabled}
                >
                  <IconList className="size-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Bullet list</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={activeOrderedList}
                  onPointerDown={handleToolAction("insertOrderedList")}
                  aria-label="Ordered list"
                  disabled={disabled}
                >
                  <IconListNumbers className="size-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Ordered list</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Popover
              open={linkPopoverOpen}
              onOpenChange={(open) => {
                setLinkPopoverOpen(open)
                if (open) saveSelection()
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Toggle
                      size="sm"
                      pressed={false}
                      aria-label="Insert link"
                      disabled={disabled}
                    >
                      <IconLink className="size-4" />
                    </Toggle>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Insert link</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <Label htmlFor="rte-link-url" className="text-xs font-medium">
                    URL
                  </Label>
                  <Input
                    id="rte-link-url"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleInsertLink()
                      }
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        restoreSelection()
                        skipSyncRef.current = true
                        exec("unlink")
                        setLinkPopoverOpen(false)
                        setLinkUrl("")
                      }}
                    >
                      Remove
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        handleInsertLink()
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </TooltipProvider>
      </div>

      {/* Editor area */}
      <div className="relative">
        {showPlaceholder && !isFocused && (
          <div className="pointer-events-none absolute left-4 top-3 select-none text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          className="prose prose-sm dark:prose-invert max-w-none px-4 py-3 focus:outline-none"
          style={{ minHeight }}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyUp={readFormatState}
          onMouseUp={readFormatState}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Footer */}
      {maxLength && (
        <div className="flex items-center justify-end border-t px-4 py-2">
          <span
            className={`text-xs ${
              charCount > maxLength
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {charCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}

// --- Sub-components ---

function HeadingDropdown({
  activeHeading,
  onSelect,
  onOpen,
  disabled,
}: {
  activeHeading: HeadingLevel | null
  onSelect: (level: HeadingLevel) => void
  onOpen: () => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  const label = activeHeading ? HEADING_LABELS[activeHeading] : "Body"

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) onOpen()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          disabled={disabled}
        >
          {label}
          <IconChevronDown className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-36 p-1">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            className={`rounded px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors ${
              !activeHeading ? "bg-muted font-medium" : ""
            }`}
            onPointerDown={(e) => {
              e.preventDefault()
              document.execCommand("formatBlock", false, "<p>")
              setOpen(false)
            }}
          >
            Body
          </button>
          {(["h2", "h3", "h4"] as HeadingLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              className={`rounded px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors ${
                activeHeading === level ? "bg-muted font-medium" : ""
              }`}
              onPointerDown={(e) => {
                e.preventDefault()
                onSelect(level)
                setOpen(false)
              }}
            >
              <span
                className={
                  level === "h2"
                    ? "text-base font-bold"
                    : level === "h3"
                    ? "text-sm font-bold"
                    : "text-xs font-bold"
                }
              >
                {HEADING_LABELS[level]}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
