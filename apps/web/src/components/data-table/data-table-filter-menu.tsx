"use client"

import type { Column, Table } from "@tanstack/react-table"
import { BadgeCheck, CalendarIcon, Check, ListFilter, Text, X } from "lucide-react"
import { useQueryState } from "nuqs"
import * as React from "react"

import { DataTableRangeFilter } from "@/components/data-table/data-table-range-filter"
import { getDefaultFilterOperator, getFilterOperators } from "@/components/data-table/lib/data-table"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { formatDate } from "@adscrush/shared/lib/format"
import { generateId } from "@adscrush/shared/lib/id"
import { getFiltersStateParser } from "@adscrush/shared/lib/parsers"
import type { ExtendedColumnFilter, FilterOperator } from "@adscrush/shared/types/data-table"
import { Button } from "@adscrush/ui/components/button"
import { Calendar } from "@adscrush/ui/components/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@adscrush/ui/components/command"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@adscrush/ui/components/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@adscrush/ui/components/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@adscrush/ui/components/select"
import { cn } from "@adscrush/ui/lib/utils"
import { IconLoader2 } from "@tabler/icons-react"
import { DynamicFilterValueSelector } from "./dynamic-filter-value-selector"
import { DynamicFilterChipDisplay } from "./dynamic-filter-chip-display"

const DEBOUNCE_MS = 300
const THROTTLE_MS = 50
const FILTER_SHORTCUT_KEY = "f"
const REMOVE_FILTER_SHORTCUTS = ["backspace", "delete"]

interface DataTableFilterMenuProps<TData> extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>
  debounceMs?: number
  throttleMs?: number
  shallow?: boolean
  /** Custom render for the filter trigger button. Use to position the trigger separately from chips. */
  renderTrigger?: (trigger: React.ReactNode) => React.ReactNode
}

export function DataTableFilterMenu<TData>({
  table,
  debounceMs = DEBOUNCE_MS,
  throttleMs = THROTTLE_MS,
  shallow = true,
  renderTrigger,
  align = "start",
  ...props
}: DataTableFilterMenuProps<TData>) {
  const id = React.useId()
  const [isPending, startTransition] = React.useTransition()

  const columns = React.useMemo(() => {
    return table.getAllColumns().filter((column) => column.columnDef.enableColumnFilter)
  }, [table])

  const [open, setOpen] = React.useState(false)
  const [selectedColumn, setSelectedColumn] = React.useState<Column<TData> | null>(null)
  const [inputValue, setInputValue] = React.useState("")
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const onOpenChange = React.useCallback((open: boolean) => {
    setOpen(open)

    if (!open) {
      setTimeout(() => {
        setSelectedColumn(null)
        setInputValue("")
      }, 100)
    }
  }, [])

  const onInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase()) && !inputValue && selectedColumn) {
        event.preventDefault()
        setSelectedColumn(null)
      }
    },
    [inputValue, selectedColumn]
  )

  const [filters, setFilters] = useQueryState(
    table.options.meta?.queryKeys?.filters ?? "filters",
    getFiltersStateParser<TData>(columns.map((field) => field.id))
      .withDefault([])
      .withOptions({
        clearOnDefault: true,
        shallow,
        throttleMs,
        startTransition,
      })
  )
  const debouncedSetFilters = useDebouncedCallback(setFilters, debounceMs)

  const onFilterAdd = React.useCallback(
    (column: Column<TData>, value: string) => {
      if (!value.trim() && column.columnDef.meta?.variant !== "boolean") {
        return
      }

      const filterValue = column.columnDef.meta?.variant === "multiSelect" ? [value] : value

      const newFilter: ExtendedColumnFilter<TData> = {
        id: column.id as Extract<keyof TData, string>,
        value: filterValue,
        variant: column.columnDef.meta?.variant ?? "text",
        operator: getDefaultFilterOperator(column.columnDef.meta?.variant ?? "text"),
        filterId: generateId({ length: 8 }),
      }

      debouncedSetFilters([...filters, newFilter])
      setOpen(false)

      setTimeout(() => {
        setSelectedColumn(null)
        setInputValue("")
      }, 100)
    },
    [filters, debouncedSetFilters]
  )

  const onFilterValueToggle = React.useCallback(
    (column: Column<TData>, value: string) => {
      setFilters((prevFilters) => {
        const existingFilter = prevFilters.find(
          (filter) => filter.id === column.id && filter.variant === "multiSelect"
        )

        if (!existingFilter) {
          const newFilter: ExtendedColumnFilter<TData> = {
            id: column.id as Extract<keyof TData, string>,
            value: [value],
            variant: "multiSelect",
            operator: getDefaultFilterOperator("multiSelect"),
            filterId: generateId({ length: 8 }),
          }
          return [...prevFilters, newFilter]
        }

        const currentValues = Array.isArray(existingFilter.value)
          ? existingFilter.value
          : []
        const nextValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value]

        if (nextValues.length === 0) {
          return prevFilters.filter(
            (filter) => filter.filterId !== existingFilter.filterId
          )
        }

        return prevFilters.map((filter) =>
          filter.filterId === existingFilter.filterId
            ? { ...filter, value: nextValues }
            : filter
        )
      })
    },
    [setFilters]
  )

  const onFilterRemove = React.useCallback(
    (filterId: string) => {
      const updatedFilters = filters.filter((filter) => filter.filterId !== filterId)
      debouncedSetFilters(updatedFilters)
      requestAnimationFrame(() => {
        triggerRef.current?.focus()
      })
    },
    [filters, debouncedSetFilters]
  )

  const onFilterUpdate = React.useCallback(
    (filterId: string, updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>) => {
      debouncedSetFilters((prevFilters) => {
        const updatedFilters = prevFilters.map((filter) => {
          if (filter.filterId === filterId) {
            return { ...filter, ...updates } as ExtendedColumnFilter<TData>
          }
          return filter
        })
        return updatedFilters
      })
    },
    [debouncedSetFilters]
  )

  const onFiltersReset = React.useCallback(() => {
    debouncedSetFilters([])
  }, [debouncedSetFilters])

  const selectedValues = React.useMemo(() => {
    if (!selectedColumn || selectedColumn.columnDef.meta?.variant !== "multiSelect") {
      return []
    }
    const filter = filters.find(
      (filter) => filter.id === selectedColumn.id && filter.variant === "multiSelect"
    )
    return filter && Array.isArray(filter.value) ? filter.value : []
  }, [filters, selectedColumn])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.contentEditable === "true")
      ) {
        return
      }

      if (event.key.toLowerCase() === FILTER_SHORTCUT_KEY && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase()) && filters.length > 0) {
        event.preventDefault()
        onFilterRemove(filters[filters.length - 1]?.filterId ?? "")
      }
    },
    [filters, onFilterRemove]
  )

  const filterTrigger = (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Open filter command menu"
          variant="outline"
          size={filters.length > 0 ? "icon" : "sm"}
          className={cn(filters.length > 0 && "size-8", "font-normal", "h-7")}
          ref={triggerRef}
          onKeyDown={onTriggerKeyDown}
        >
          <ListFilter className="text-muted-foreground" />
          {filters.length > 0 ? null : "Filter"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-full max-w-(--radix-popover-content-available-width) p-0" {...props}>
        <Command
          loop
          className="text-xs/relaxed [&_[data-slot=command-input-wrapper]_svg]:size-3.5"
        >
          <CommandInput
            ref={inputRef}
            placeholder={
              selectedColumn ? (selectedColumn.columnDef.meta?.label ?? selectedColumn.id) : "Search fields..."
            }
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={onInputKeyDown}
            className="text-xs placeholder:text-xs"
          />
          <CommandList>
            {selectedColumn ? (
              <>
                <FilterValueSelector
                  column={selectedColumn}
                  value={inputValue}
                  selectedValues={selectedValues}
                  onSelect={(value) => {
                    if (selectedColumn.columnDef.meta?.variant === "multiSelect") {
                      onFilterValueToggle(selectedColumn, value)
                      return
                    }
                    onFilterAdd(selectedColumn, value)
                  }}
                />
              </>
            ) : (
              <>
                <CommandEmpty>No fields found.</CommandEmpty>
                <CommandGroup>
                  {columns.map((column) => (
                    <CommandItem
                      key={column.id}
                      value={column.id}
                      onSelect={() => {
                        setSelectedColumn(column)
                        setInputValue("")
                        requestAnimationFrame(() => {
                          inputRef.current?.focus()
                        })
                      }}
                    >
                      {column.columnDef.meta?.icon && <column.columnDef.meta.icon className="size-3" />}
                      <span className="truncate text-xs">{column.columnDef.meta?.label ?? column.id}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  const filterChips = (
    <>
      {filters.map((filter) => (
        <DataTableFilterItem
          key={filter.filterId}
          filter={filter}
          filterItemId={`${id}-filter-${filter.filterId}`}
          columns={columns}
          onFilterUpdate={onFilterUpdate}
          onFilterRemove={onFilterRemove}
          isPending={isPending}
        />
      ))}
      {filters.length > 0 && (
        <Button
          aria-label="Reset all filters"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onFiltersReset}
        >
          <X className="size-3" />
          Clear all
        </Button>
      )}
    </>
  )

  // If renderTrigger is provided, use it to position the trigger separately
  if (renderTrigger) {
    return (
      <>
        {renderTrigger(filterTrigger)}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filterChips}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filterChips}
      {filterTrigger}
    </div>
  )
}

interface DataTableFilterItemProps<TData> {
  isPending: boolean
  filter: ExtendedColumnFilter<TData>
  filterItemId: string
  columns: Column<TData>[]
  onFilterUpdate: (filterId: string, updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>) => void
  onFilterRemove: (filterId: string) => void
}

function DataTableFilterItem<TData>({
  filter,
  filterItemId,
  columns,
  onFilterUpdate,
  onFilterRemove,
  isPending,
}: DataTableFilterItemProps<TData>) {
  {
    const [showFieldSelector, setShowFieldSelector] = React.useState(false)
    const [showOperatorSelector, setShowOperatorSelector] = React.useState(false)
    const [showValueSelector, setShowValueSelector] = React.useState(false)

    const column = columns.find((column) => column.id === filter.id)

    const operatorListboxId = `${filterItemId}-operator-listbox`
    const inputId = `${filterItemId}-input`

    const columnMeta = column?.columnDef.meta
    const filterOperators = getFilterOperators(filter.variant)

    const onItemKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
          return
        }

        if (showFieldSelector || showOperatorSelector || showValueSelector) {
          return
        }

        if (REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase())) {
          event.preventDefault()
          onFilterRemove(filter.filterId)
        }
      },
      [filter.filterId, showFieldSelector, showOperatorSelector, showValueSelector, onFilterRemove]
    )

    if (!column) return null

    return (
      <div
        key={filter.filterId}
        role="listitem"
        id={filterItemId}
        className="flex h-8 items-center rounded-md border bg-secondary/50 text-xs shadow-sm"
        onKeyDown={onItemKeyDown}
      >
        <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-full rounded-none rounded-l-md border-r-0 px-2 font-normal hover:bg-secondary"
            >
              {columnMeta?.icon && <columnMeta.icon className="size-3.5 text-muted-foreground" />}
              <span className="truncate text-xs">{columnMeta?.label ?? column.id}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-0">
            <Command loop className="text-xs/relaxed [&_[data-slot=command-input-wrapper]_svg]:size-3">
              <CommandInput placeholder="Search fields..." className="text-xs placeholder:text-xs" />
              <CommandList>
                <CommandEmpty>No fields found.</CommandEmpty>
                <CommandGroup>
                  {columns.map((column) => (
                    <CommandItem
                      key={column.id}
                      value={column.id}
                      onSelect={() => {
                        onFilterUpdate(filter.filterId, {
                          id: column.id as Extract<keyof TData, string>,
                          variant: column.columnDef.meta?.variant ?? "text",
                          operator: getDefaultFilterOperator(column.columnDef.meta?.variant ?? "text"),
                          value: "",
                        })

                        setShowFieldSelector(false)
                      }}
                    >
                      {column.columnDef.meta?.icon && <column.columnDef.meta.icon className="size-3" />}
                      <span className="truncate text-xs">{column.columnDef.meta?.label ?? column.id}</span>
                      <Check className={cn("ml-auto size-3", column.id === filter.id ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Select
          open={showOperatorSelector}
          onOpenChange={setShowOperatorSelector}
          value={filter.operator}
          onValueChange={(value: FilterOperator) =>
            onFilterUpdate(filter.filterId, {
              operator: value,
              value: value === "isEmpty" || value === "isNotEmpty" ? "" : filter.value,
            })
          }
        >
          <SelectTrigger
            aria-controls={operatorListboxId}
            className="h-full rounded-none border-l border-r-0 px-2 lowercase text-xs data-size:h-8 [&_svg]:hidden"
          >
            <SelectValue placeholder={filter.operator} />
          </SelectTrigger>
          <SelectContent id={operatorListboxId}>
            {filterOperators.map((operator) => (
              <SelectItem key={operator.value} className="lowercase" value={operator.value}>
                {operator.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
                <FilterInput
          filter={filter}
          column={column}
          inputId={inputId}
          onFilterUpdate={onFilterUpdate}
          showValueSelector={showValueSelector}
          setShowValueSelector={setShowValueSelector}
          isPending={isPending}
        />
        <Button
          aria-controls={filterItemId}
          variant="ghost"
          size="sm"
          className="h-full rounded-none rounded-r-md border-l px-1.5 font-normal text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onFilterRemove(filter.filterId)}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    )
  }
}

interface FilterValueSelectorProps<TData> {
  column: Column<TData>
  value: string
  selectedValues?: string[]
  onSelect: (value: string) => void
}

function FilterValueSelector<TData>({ column, value, selectedValues = [], onSelect }: FilterValueSelectorProps<TData>) {
  const variant = column.columnDef.meta?.variant ?? "text"
  const dynamicOptions = column.columnDef.meta?.dynamicOptions

  switch (variant) {
    case "boolean":
      return (
        <CommandGroup>
          <CommandItem value="true" onSelect={() => onSelect("true")}>
            True
          </CommandItem>
          <CommandItem value="false" onSelect={() => onSelect("false")}>
            False
          </CommandItem>
        </CommandGroup>
      )

    case "select":
    case "multiSelect": {
      const isMultiSelect = variant === "multiSelect"

      // Use dynamic server-side search if column has dynamicOptions
      if (dynamicOptions?.resourceType) {
        return (
          <DynamicFilterValueSelector
            resourceType={dynamicOptions.resourceType}
            searchQuery={value}
            selectedValues={selectedValues}
            onSelect={onSelect}
          />
        )
      }

      // Otherwise use static options
      return (
        <CommandGroup>
          {column.columnDef.meta?.options?.map((option) => {
            const isSelected = selectedValues.includes(option.value)

            return (
              <CommandItem
                key={option.value}
                value={option.value}
                keywords={[option.label]}
                onSelect={() => onSelect(option.value)}
              >
                {option.image ? (
                  <img
                    src={option.image}
                    alt=""
                    className="size-5 rounded object-cover"
                  />
                ) : option.icon ? (
                  <option.icon className="size-3" />
                ) : null}
                <span className="truncate text-xs">{option.label}</span>
                {isMultiSelect ? (
                  <Check
                    className={cn(
                      "ml-auto size-3",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                ) : option.count ? (
                  <span className="ml-auto font-mono text-xs">{option.count}</span>
                ) : (
                  <span className="ml-auto font-mono text-xs">0</span>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
      )
    }

    case "date":
    case "dateRange":
      return (
        <Calendar
          autoFocus
          captionLayout="dropdown"
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => onSelect(date?.getTime().toString() ?? "")}
        />
      )

    default: {
      const isEmpty = !value.trim()

      return (
        <CommandGroup>
          <CommandItem value={value} onSelect={() => onSelect(value)} disabled={isEmpty}>
            {isEmpty ? (
              <>
                <Text className="size-3" />
                <span className="text-xs">Type to add filter...</span>
              </>
            ) : (
              <>
                <BadgeCheck className="size-3" />
                <span className="truncate text-xs">Filter by &quot;{value}&quot;</span>
              </>
            )}
          </CommandItem>
        </CommandGroup>
      )
    }
  }
}

function FilterInput<TData>({
  filter,
  column,
  inputId,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
  isPending,
}: {
  filter: ExtendedColumnFilter<TData>
  column: Column<TData>
  inputId: string
  onFilterUpdate: (filterId: string, updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>) => void
  showValueSelector: boolean
  setShowValueSelector: (value: boolean) => void
  isPending: boolean
}) {
  // State for search input in dynamic filters
  const [searchValue, setSearchValue] = React.useState("")

  if (filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
    return (
      <div
        id={inputId}
        role="status"
        aria-label={`${column.columnDef.meta?.label} filter is ${filter.operator === "isEmpty" ? "empty" : "not empty"}`}
        aria-live="polite"
        className="h-full w-16 rounded-none border-l border-r-0 bg-transparent px-1.5 py-0.5 text-xs text-muted-foreground"
      />
    )
  }

  switch (filter.variant) {
    case "text":
    case "number":
    case "range": {
      if ((filter.variant === "range" && filter.operator === "isBetween") || filter.operator === "isBetween") {
        return (
          <DataTableRangeFilter
            filter={filter}
            column={column}
            inputId={inputId}
            onFilterUpdate={onFilterUpdate}
            className="size-full max-w-28 gap-0 **:data-[slot='range-min']:border-r-0 [&_input]:rounded-none [&_input]:px-1.5"
          />
        )
      }

      const isNumber = filter.variant === "number" || filter.variant === "range"

      return (
        <InputGroup className="rounded-none">
          <InputGroupInput
            id={inputId}
            type={isNumber ? "number" : "text"}
            inputMode={isNumber ? "numeric" : undefined}
            placeholder={column.columnDef.meta?.placeholder ?? "Enter value..."}
            className="h-full w-24 rounded-none px-1.5"
            defaultValue={typeof filter.value === "string" ? filter.value : ""}
            onChange={(event) => onFilterUpdate(filter.filterId, { value: event.target.value })}
          />
          {isPending && (
            <InputGroupAddon align="inline-end">
              <IconLoader2 className="size-3 animate-spin text-muted-foreground" />
            </InputGroupAddon>
          )}
        </InputGroup>
      )
    }

    case "boolean": {
      const inputListboxId = `${inputId}-listbox`

      return (
        <Select
          open={showValueSelector}
          onOpenChange={setShowValueSelector}
          value={typeof filter.value === "string" ? filter.value : "true"}
          onValueChange={(value: "true" | "false") => onFilterUpdate(filter.filterId, { value })}
        >
          <SelectTrigger
            id={inputId}
            aria-controls={inputListboxId}
            className="h-full rounded-none border-l border-r-0 px-2 text-xs [&_svg]:hidden"
          >
            <SelectValue placeholder={filter.value ? "True" : "False"} />
          </SelectTrigger>
          <SelectContent id={inputListboxId}>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    case "select":
    case "multiSelect": {
      const inputListboxId = `${inputId}-listbox`
      const dynamicOptions = column.columnDef.meta?.dynamicOptions

      const options = column.columnDef.meta?.options ?? []
      const selectedValues = Array.isArray(filter.value) ? filter.value : [filter.value]

      const selectedOptions = options.filter((option) => selectedValues.includes(option.value))

      return (
        <Popover open={showValueSelector} onOpenChange={(open) => {
          setShowValueSelector(open)
          if (!open) {
            setSearchValue("") // Reset search when closing
          }
        }}>
          <PopoverTrigger asChild>
            <Button
              id={inputId}
              aria-controls={inputListboxId}
              variant="ghost"
              size="sm"
              className="h-full min-w-16 rounded-none border-l border-r-0 px-2 font-normal text-xs"
            >
              {selectedValues.length === 0 || (selectedValues.length === 1 && !selectedValues[0]) ? (
                filter.variant === "multiSelect" ? (
                  "Select options..."
                ) : (
                  "Select option..."
                )
              ) : dynamicOptions?.resourceType ? (
                // Use dynamic display for columns with server-side search
                <DynamicFilterChipDisplay
                  resourceType={dynamicOptions.resourceType}
                  selectedValues={selectedValues.filter((v): v is string => Boolean(v))}
                />
              ) : (
                // Use static display for columns with pre-loaded options
                <>
                  <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                    {selectedOptions.slice(0, 3).map((selectedOption) =>
                      selectedOption.image ? (
                        <div key={selectedOption.value} className="rounded-full border bg-background">
                          <img
                            src={selectedOption.image}
                            alt=""
                            className="size-5 rounded-full object-cover"
                          />
                        </div>
                      ) : selectedOption.icon ? (
                        <div key={selectedOption.value} className="rounded-full border bg-background p-0.5">
                          <selectedOption.icon className="size-3.5" />
                        </div>
                      ) : null
                    )}
                  </div>
                  <span className="truncate text-xs">
                    {selectedOptions.length > 1 ? `${selectedOptions.length} selected` : selectedOptions[0]?.label}
                  </span>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent id={inputListboxId} align="start" className="w-48 p-0">
            <Command className="text-xs/relaxed [&_[data-slot=command-input-wrapper]_svg]:size-3" shouldFilter={dynamicOptions?.resourceType ? false : true}>
              <CommandInput
                placeholder="Search options..."
                className="text-xs placeholder:text-xs"
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                {dynamicOptions?.resourceType ? (
                  // Use dynamic value selector for server-side search
                  <DynamicFilterValueSelector
                    resourceType={dynamicOptions.resourceType}
                    searchQuery={searchValue}
                    selectedValues={selectedValues.filter((v): v is string => Boolean(v))}
                    showOnlySelectedByDefault={selectedValues.length > 0}
                    onSelect={(value) => {
                      const newValue =
                        filter.variant === "multiSelect"
                          ? selectedValues.includes(value)
                            ? selectedValues.filter((v) => v !== value)
                            : [...selectedValues, value]
                          : value
                      onFilterUpdate(filter.filterId, { value: newValue })
                    }}
                  />
                ) : (
                  // Use static options for pre-loaded data
                  <>
                    <CommandEmpty>No options found.</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          keywords={[option.label]}
                          onSelect={() => {
                            const value =
                              filter.variant === "multiSelect"
                                ? selectedValues.includes(option.value)
                                  ? selectedValues.filter((v) => v !== option.value)
                                  : [...selectedValues, option.value]
                                : option.value
                            onFilterUpdate(filter.filterId, { value })
                          }}
                        >
                          {option.image ? (
                            <img
                              src={option.image}
                              alt=""
                              className="size-5 rounded object-cover"
                            />
                          ) : option.icon ? (
                            <option.icon className="size-3" />
                          ) : null}
                          <span className="truncate text-xs">{option.label}</span>
                          {filter.variant === "multiSelect" && (
                            <Check
                              className={cn("ml-auto size-3", selectedValues.includes(option.value) ? "opacity-100" : "opacity-0")}
                            />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )
    }

    case "date":
    case "dateRange": {
      const inputListboxId = `${inputId}-listbox`

      const dateValue = Array.isArray(filter.value)
        ? filter.value.filter(Boolean)
        : [filter.value, filter.value].filter(Boolean)

      const displayValue =
        filter.operator === "isBetween" && dateValue.length === 2
          ? `${formatDate(new Date(Number(dateValue[0])))} - ${formatDate(new Date(Number(dateValue[1])))}`
          : dateValue[0]
            ? formatDate(new Date(Number(dateValue[0])))
            : "Pick date..."

      return (
        <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
          <PopoverTrigger asChild>
            <Button
              id={inputId}
              aria-controls={inputListboxId}
              variant="ghost"
              size="sm"
              className={cn(
                "h-full rounded-none border-l border-r-0 px-2 font-normal text-xs",
                !filter.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="size-3.5" />
              <span className="truncate">{displayValue}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent id={inputListboxId} align="start" className="w-auto p-0">
            {filter.operator === "isBetween" ? (
              <Calendar
                autoFocus
                captionLayout="dropdown"
                mode="range"
                selected={
                  dateValue.length === 2
                    ? {
                        from: new Date(Number(dateValue[0])),
                        to: new Date(Number(dateValue[1])),
                      }
                    : {
                        from: new Date(),
                        to: new Date(),
                      }
                }
                onSelect={(date) => {
                  onFilterUpdate(filter.filterId, {
                    value: date ? [(date.from?.getTime() ?? "").toString(), (date.to?.getTime() ?? "").toString()] : [],
                  })
                }}
              />
            ) : (
              <Calendar
                autoFocus
                captionLayout="dropdown"
                mode="single"
                selected={dateValue[0] ? new Date(Number(dateValue[0])) : undefined}
                onSelect={(date) => {
                  onFilterUpdate(filter.filterId, {
                    value: (date?.getTime() ?? "").toString(),
                  })
                }}
              />
            )}
          </PopoverContent>
        </Popover>
      )
    }

    default:
      return null
  }
}
