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
import { useDepartments, useCreateDepartment } from "../queries"
import { toast } from "@adscrush/ui/sonner"

interface DepartmentSelectProps {
  value?: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
}

export function DepartmentSelect({
  value,
  onValueChange,
  placeholder = "Select Department...",
  disabled,
}: DepartmentSelectProps) {
  const [q, setQ] = React.useState("")
  const createDepartment = useCreateDepartment()

  const [debouncedQuery, debouncer] = useDebouncedValue(
    q,
    { wait: 300 },
    (state) => ({ isPending: state.isPending })
  )

  const {
    data: departmentsResult,
    isLoading: isQueryLoading,
    isFetching,
  } = useDepartments({
    name: debouncedQuery,
    filterFlag: "commandFilters",
    page: 1,
    perPage: 50,
    sort: [{ id: "createdAt", desc: true }],
    filters: [],
    joinOperator: "and",
    status: [],
    createdAt: [],
  })

  const departments = React.useMemo(
    () => departmentsResult?.data ?? [],
    [departmentsResult?.data]
  )
  const isLoading = isQueryLoading || debouncer.state.isPending || isFetching

  const selectedDepartment = React.useMemo(() => {
    return departments.find((d: { id: string }) => d.id === value)
  }, [departments, value])

  const handleCreate = async () => {
    if (!q) return
    try {
      const newDept = await createDepartment.mutateAsync({ name: q })
      if (newDept) {
        onValueChange(newDept.id)
      }
      setQ("")
      toast.success("Department created")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create department")
    }
  }

  return (
    <Combobox
      autoHighlight
      items={departments}
      value={selectedDepartment ?? null}
      itemToStringValue={(dept) => dept.name}
      onValueChange={(dept) => onValueChange(dept?.id ?? null)}
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
              {selectedDepartment ? (
                <span className="truncate">{selectedDepartment.name}</span>
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
            placeholder="Search department..."
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
          {(dept) => (
            <ComboboxItem key={dept.id} value={dept}>
              <span className="truncate text-xs font-medium">
                {dept.name}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
