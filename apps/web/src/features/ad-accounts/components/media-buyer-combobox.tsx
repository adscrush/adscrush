"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
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
import { trpc } from "@/lib/trpc/client"
import { getInitials } from "@adscrush/shared/lib/initials"
import { IconCheck, IconLoader2, IconSearch } from "@tabler/icons-react"
import * as React from "react"

interface MediaBuyerComboboxProps {
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  selectedMediaBuyer?: { name: string; image: string | null } | null
}

export function MediaBuyerCombobox({
  value,
  onValueChange,
  placeholder = "Select media buyer",
  selectedMediaBuyer,
}: MediaBuyerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")

  const searchQuery = trpc.mediaBuyers.search.useQuery(
    { q: q || undefined },
    { enabled: open || !!value, staleTime: 30_000 },
  )
  const results = searchQuery.data ?? []

  const selected = results.find((r) => r.id === value) ?? selectedMediaBuyer ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value && selected ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="size-5 shrink-0">
                {selected.image ? (
                  <AvatarImage src={selected.image} alt={selected.name ?? ""} />
                ) : null}
                <AvatarFallback className="text-[0.5rem]">
                  {getInitials(selected.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selected.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <IconSearch className="ml-auto size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search media buyers..."
            value={q}
            onValueChange={setQ}
          />
          <CommandList>
            {searchQuery.isLoading ? (
              <div className="flex items-center justify-center py-4">
                <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>No media buyers found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((mb) => (
                  <CommandItem
                    key={mb.id}
                    value={mb.id}
                    onSelect={() => {
                      const newValue = mb.id === value ? null : mb.id
                      setOpen(false)
                      setQ("")
                      onValueChange(newValue)
                    }}
                    className="gap-2"
                  >
                    <Avatar className="size-5 shrink-0">
                      <AvatarImage src={mb.image ?? undefined} alt={mb.name ?? ""} />
                      <AvatarFallback className="text-[0.5rem]">
                        {getInitials(mb.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{mb.name}</span>
                      <span className="truncate text-[10px] text-muted-foreground">{mb.email}</span>
                    </div>
                    <IconCheck
                      className={cn(
                        "ml-auto size-4 shrink-0",
                        mb.id === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
