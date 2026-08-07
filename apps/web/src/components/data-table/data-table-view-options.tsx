"use client"

import type { Column, Table } from "@tanstack/react-table"
import { Check, GripVertical, RotateCcw, Settings2 } from "lucide-react"
import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@adscrush/ui/components/button"
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
import { cn } from "@adscrush/ui/lib/utils"

interface SortableColumnItemProps<TData> {
  column: Column<TData>
  onToggleVisibility: (columnId: string) => void
}

function SortableColumnItem<TData>({
  column,
  onToggleVisibility,
}: SortableColumnItemProps<TData>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex w-full items-center gap-1"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
        aria-label={`Drag to reorder ${column.columnDef.meta?.label ?? column.id}`}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        className="group flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs/relaxed ring-0 outline-none hover:bg-accent hover:text-accent-foreground"
        onClick={() => onToggleVisibility(column.id)}
      >
        <span className="truncate">
          {column.columnDef.meta?.label ?? column.id}
        </span>
        <Check
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-foreground",
            column.getIsVisible() ? "opacity-100" : "opacity-0"
          )}
        />
      </button>
    </div>
  )
}

interface DataTableViewOptionsProps<TData> extends React.ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({
  table,
  ...props
}: DataTableViewOptionsProps<TData>) {
  const columnIds = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== "undefined" && column.getCanHide()
        )
        .map((col) => col.id),
    [table]
  )

  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== "undefined" && column.getCanHide()
        ),
    [table]
  )

  const columnKeys = React.useMemo(() => columns.map((c) => c.id).join(","), [columns])

  const STORAGE_KEY = React.useMemo(() => {
    if (typeof window === "undefined") return ""
    return `data-table-column-order:${window.location.pathname}:base[${btoa(columnKeys)}]`
  }, [columnKeys])

  const defaultOrder = React.useMemo(() => columns.map((col) => col.id), [columns])

  const isClient = typeof window !== "undefined"
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() => {
    if (!isClient) return defaultOrder
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((id: string) => columnIds.includes(id))
        ) {
          return parsed
        }
      }
    } catch {
      /* ignore */
    }
    return defaultOrder
  })

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnOrder))
    } catch {
      /* ignore */
    }
  }, [columnOrder, STORAGE_KEY])

  React.useEffect(() => {
    // Sync the table's column order to our local state, adding any columns
    // that were introduced after the saved order was persisted.
    const currentIds = columnOrder.filter((id) => columnIds.includes(id))

    if (currentIds.length !== columns.length) {
      const missingColumns = columns.filter((c) => !currentIds.includes(c.id))
      missingColumns.forEach((c) => currentIds.push(c.id))
      setColumnOrder(currentIds)
    }

    table.setColumnOrder(currentIds)
  }, [columnOrder, columnIds, columns, table])

  const toggleColumnVisibility = React.useCallback(
    (columnId: string) => {
      table.getColumn(columnId)?.toggleVisibility()
    },
    [table]
  )

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setColumnOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string)
      const newIndex = prev.indexOf(over.id as string)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const sortedColumns = React.useMemo(() => {
    if (columnOrder.length === 0) return columns
    const orderMap = new Map(columnOrder.map((id, i) => [id, i]))
    return [...columns].sort((a, b) => {
      const aIndex = orderMap.get(a.id) ?? columns.length
      const bIndex = orderMap.get(b.id) ?? columns.length
      return aIndex - bIndex
    })
  }, [columns, columnOrder])

  const resetColumnOrder = React.useCallback(() => {
    setColumnOrder(columns.map((col) => col.id))
  }, [columns])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="combobox"
          variant="outline"
          size="sm"
          className="ml-auto hidden font-normal lg:flex"
        >
          <Settings2 className="text-muted-foreground" />
          View
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" {...props}>
        <Command>
          <CommandInput placeholder="Search columns..." className="h-9" />
          <CommandList data-slot="command-list">
            <CommandEmpty className="hidden">No columns found.</CommandEmpty>
            <CommandGroup
              data-column-list={sortedColumns.join(",")}
              className="flex-1"
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={sortedColumns.map((col) => col.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedColumns.map((column) => (
                    <CommandItem
                      key={column.id}
                      value={column.columnDef.meta?.label ?? column.id}
                      onSelect={() => toggleColumnVisibility(column.id)}
                      className="px-0 py-0"
                    >
                      <SortableColumnItem
                        column={column}
                        onToggleVisibility={toggleColumnVisibility}
                      />
                    </CommandItem>
                  ))}
                </SortableContext>
              </DndContext>
            </CommandGroup>
            <div className="mt-auto border-t border-border/50 px-1 py-1">
              <button
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs/relaxed font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={resetColumnOrder}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Column Order
              </button>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
