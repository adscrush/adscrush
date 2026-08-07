"use client"

import { useEmployeeSearch } from "@/features/search/queries"
import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
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
import { getInitials } from "@adscrush/shared/lib/initials"
import { useDebouncedValue } from "@tanstack/react-pacer"
import * as React from "react"

interface EmployeeSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function EmployeeSelect({
  value,
  onValueChange,
  placeholder = "Select employee...",
  disabled,
}: EmployeeSelectProps) {
  const [q, setQ] = React.useState("")

  // Use TanStack Pacer for debouncing with isPending support

  const [debouncedQuery, debouncer] = useDebouncedValue(
    q,
    {
      wait: 500,
    },
    (state) => ({ isPending: state.isPending })
  )

  const { data: employees = [], isLoading: isQueryLoading, isFetching } = useEmployeeSearch(debouncedQuery)

  const isLoading = isQueryLoading || debouncer.state.isPending || isFetching

  const selectedEmployee = React.useMemo(() => {
    return employees.find((e) => e.id === value)
  }, [employees, value])

  return (
    <Combobox
      autoHighlight
      items={employees}
      value={selectedEmployee ?? null}
      itemToStringValue={(emp) => emp.name}
      onValueChange={(emp) => onValueChange(emp?.id ?? "")}
      disabled={disabled}
    >
      <ComboboxTrigger
        render={
          <Button variant="outline" className="w-full justify-between font-normal" disabled={disabled}>
            {selectedEmployee ? (
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="size-5 shrink-0">
                  {selectedEmployee.image ? (
                    <AvatarImage src={selectedEmployee.image} alt={selectedEmployee.name} />
                  ) : null}
                  <AvatarFallback className="text-[0.5rem]">
                    {getInitials(selectedEmployee.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedEmployee.name}</span>
              </div>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            )}
            {isLoading ? (
              <IconLoader2 className="ml-2 size-3.5 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <IconSelector className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
            )}
          </Button>
        }
      />
      <ComboboxContent className="min-w-0">
        <div className="w-full p-1.5">
          <ComboboxInput
            className="min-w-0 rounded-md"
            placeholder="Search employee..."
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
              <span>Searching employees...</span>
            </div>
          ) : (
            "No results found."
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(emp: { id: string; name: string; email: string; image?: string | null }) => (
            <ComboboxItem key={emp.id} value={emp}>
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="size-5 shrink-0">
                  {emp.image ? <AvatarImage src={emp.image} alt={emp.name} /> : null}
                  <AvatarFallback className="text-[0.5rem]">
                    {getInitials(emp.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-medium">{emp.name}</span>
                  {/* <span className="truncate text-xs text-muted-foreground">
                    {emp.email}
                  </span> */}
                </div>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
