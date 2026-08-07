"use client"

import { Button } from "@adscrush/ui/components/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@adscrush/ui/components/combobox"
import { IconLoader2, IconSelector } from "@tabler/icons-react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import * as React from "react"
import { useCategories, useCreateCategory } from "../queries"
import { toast } from "@adscrush/ui/sonner"

interface CategorySelectProps {
  value?: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
}

export function CategorySelect({
  value,
  onValueChange,
  placeholder = "Select Category...",
  disabled,
}: CategorySelectProps) {
  const [q, setQ] = React.useState("")
  const createCategory = useCreateCategory()

  const [debouncedQuery, debouncer] = useDebouncedValue(
    q,
    { wait: 300 },
    (state) => ({ isPending: state.isPending })
  )

  const {
    data: categoriesResult,
    isLoading: isQueryLoading,
    isFetching,
  } = useCategories({
    search: debouncedQuery,
    filterFlag: "commandFilters",
    page: 1,
    perPage: 50,
    sort: [{ id: "createdAt", desc: true }],
    filters: [],
    joinOperator: "and",
  })

  const categories = React.useMemo(
    () => categoriesResult?.data ?? [],
    [categoriesResult?.data]
  )
  const isLoading = isQueryLoading || debouncer.state.isPending || isFetching

   const selectedCategory = React.useMemo(() => {
     return categories.find((c: { id: string }) => c.id === value)
   }, [categories, value])

  const handleCreate = async () => {
    if (!q) return
    try {
      const newCat = await createCategory.mutateAsync({ name: q })
      if (newCat) {
        onValueChange(newCat.id)
      }
      setQ("")
      toast.success("Category created")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create category")
    }
  }

  return (
    <Combobox
      autoHighlight
      items={categories}
      value={selectedCategory ?? null}
      itemToStringValue={(cat) => cat.name}
      onValueChange={(cat) => onValueChange(cat?.id ?? null)}
      disabled={disabled}
    >
      <div className="flex flex-col gap-2">
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              disabled={disabled}
            >
              {selectedCategory ? (
                <span className="truncate">{selectedCategory.name}</span>
              ) : (
                <span className="truncate text-muted-foreground">
                  {placeholder}
                </span>
              )}
              {isLoading ? (
                <IconLoader2 className="ml-2 size-3.5 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <IconSelector className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
              )}
            </Button>
          }
        />
      </div>
      <ComboboxContent className="min-w-0">
        <div className="w-full p-1.5">
          <ComboboxInput
            className="min-w-0 rounded-md"
            placeholder="Search category..."
            showTrigger={false}
            showClear={false}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <ComboboxEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <IconLoader2 className="size-3 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <span className="text-xs text-muted-foreground">No results found.</span>
              {q && (
                <Button size="xs" variant="outline" onClick={handleCreate}>
                  Create &quot;{q}&quot;
                </Button>
              )}
            </div>
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(cat) => (
            <ComboboxItem key={cat.id} value={cat}>
              <span className="truncate text-xs font-medium">
                {cat.name}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
