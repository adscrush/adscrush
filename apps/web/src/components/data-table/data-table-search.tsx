"use client"

import * as React from "react"
import { IconSearch } from "@tabler/icons-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@adscrush/ui/components/input-group"
import { Spinner } from "@adscrush/ui/components/spinner"
import { useQueryState } from "nuqs"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { cn } from "@adscrush/ui/lib/utils"

interface DataTableSearchProps {
  placeholder?: string
  isFetching?: boolean
  name?: string
}

export function DataTableSearch({
  placeholder = "Search...",
  isFetching = false,
  name = "search",
}: DataTableSearchProps) {
  const [search, setSearch] = useQueryState(name, {
    defaultValue: "",
    clearOnDefault: true,
    shallow: false,
  })

  const [value, setValue] = React.useState(search)

  React.useEffect(() => {
    setValue(search)
  }, [search])

  const [debouncedSearch, debouncer] = useDebouncedValue(
    value,
    { wait: 500 },
    (state) => ({ isPending: state.isPending })
  )

  React.useEffect(() => {
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch)
    }
  }, [debouncedSearch, search, setSearch])

  const isLoading = debouncer.state.isPending || isFetching

  return (
    <InputGroup className="h-6 w-40 lg:w-64">
      <InputGroupAddon align="inline-start">
        <IconSearch className="size-4 text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <InputGroupAddon
        align="inline-end"
        className={cn(!isLoading && "invisible")}
      >
        <Spinner className="size-3.5" />
      </InputGroupAddon>
    </InputGroup>
  )
}
