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
import { useLanguages, useLanguage } from "@/features/languages/queries"

interface LanguageSelectProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function LanguageSelect({
  value,
  onValueChange,
  disabled,
}: LanguageSelectProps) {
  const [q, setQ] = React.useState("")

  // Fetch the selected language by ID for immediate display
  const { data: selectedLanguage, isLoading: isLoadingSelected } = useLanguage(
    value ?? ""
  )

  const [debouncedQuery, debouncer] = useDebouncedValue(
    q,
    { wait: 300 },
    (state) => ({ isPending: state.isPending })
  )

  const {
    data: languagesResult,
    isLoading: isQueryLoading,
    isFetching,
  } = useLanguages({
    search: debouncedQuery,
    filterFlag: "commandFilters",
    page: 1,
    perPage: 100,
    sort: [{ id: "name", desc: false }],
    filters: [],
    joinOperator: "and",
  })

  const languages = React.useMemo(
    () => languagesResult?.data ?? [],
    [languagesResult?.data]
  )
  const isLoading = isQueryLoading || debouncer.state.isPending || isFetching

  // Use the selected language from the dedicated query for immediate display
  const selected = selectedLanguage ?? languages.find((l: { id: string }) => l.id === value)

  // Ensure selected language is always in the items list
  const items = React.useMemo(() => {
    if (!selected) return languages
    if (languages.some((l: { id: string }) => l.id === selected.id)) return languages
    return [selected, ...languages]
  }, [languages, selected])

  return (
    <Combobox
      autoHighlight
      items={items}
      value={selected ?? null}
      itemToStringValue={(l) => l.name}
      onValueChange={(l) => {
        if (l) onValueChange(l.id)
      }}
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
              {isLoadingSelected || isLoading ? (
                <span className="truncate text-muted-foreground">
                  Loading languages...
                </span>
              ) : selected ? (
                <span className="truncate">{selected.name}</span>
              ) : (
                <span className="truncate text-muted-foreground">
                  Select language...
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
            placeholder="Search language..."
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
              <span className="text-xs text-muted-foreground">
                No results found.
              </span>
            </div>
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(l: { id: string; name: string; code: string }) => (
            <ComboboxItem key={l.id} value={l}>
              <span className="truncate text-xs font-medium">
                {l.name}
                <span className="ml-1.5 text-muted-foreground font-mono text-[10px]">
                  {l.code}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
