"use client"

import { Button } from "@adscrush/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@adscrush/ui/components/command"
import { Popover, PopoverContent, PopoverTrigger } from "@adscrush/ui/components/popover"
import { cn } from "@adscrush/ui/lib/utils"
import { trpc } from "@/lib/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { IconCheck, IconLoader2, IconSearch } from "@tabler/icons-react"
import * as React from "react"

interface FunnelComboboxProps {
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  /**
   * Portal (media buyer) variant — queries the product-scoped funnel list
   * (`portal.myFunnelsList`) instead of the internal one, so buyers can only
   * pick funnels from products assigned to them.
   */
  portal?: boolean
}

export function FunnelCombobox({
  value,
  onValueChange,
  placeholder = "Select funnel",
  disabled,
  portal,
}: FunnelComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")

  // Query either the internal funnel list or the portal's product-scoped list
  // (media buyer). A single useQuery keeps hook order stable; the branch lives
  // inside the key/fetcher. Keys mirror the tRPC procedure paths so cache
  // invalidation (utils.funnels.list.invalidate / utils.portal.myFunnelsList.invalidate)
  // still hits these queries.
  const utils = trpc.useUtils()
  const searchQuery = useQuery({
    queryKey: portal
      ? ["portal", "myFunnelsList", { search: q, perPage: 20, status: ["active"] }]
      : ["funnels", "list", { search: q, perPage: 20, status: ["active"] }],
    queryFn: () =>
      portal
        ? utils.portal.myFunnelsList.fetch({ search: q, perPage: 20, status: ["active"] })
        : utils.funnels.list.fetch({ search: q, perPage: 20, status: ["active"] }),
    enabled: open || !!value,
    staleTime: 30_000,
  })
  const results = searchQuery.data?.items ?? []

  const selected = results.find((r) => r.id === value) ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {value && selected ? (
            <span className="truncate">
              {selected.name}
              {selected.product ? ` — ${selected.product.name}` : ""}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <IconSearch className="ml-auto size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search funnels..." value={q} onValueChange={setQ} />
          <CommandList>
            {searchQuery.isLoading ? (
              <div className="flex items-center justify-center py-4">
                <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>No funnels found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((funnel) => (
                  <CommandItem
                    key={funnel.id}
                    value={funnel.id}
                    onSelect={() => {
                      const newValue = funnel.id === value ? null : funnel.id
                      setOpen(false)
                      setQ("")
                      onValueChange(newValue)
                    }}
                    className="gap-2"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{funnel.name}</span>
                      {funnel.product?.name && (
                        <span className="truncate text-[10px] text-muted-foreground">{funnel.product.name}</span>
                      )}
                    </div>
                    <IconCheck
                      className={cn("ml-auto size-4 shrink-0", funnel.id === value ? "opacity-100" : "opacity-0")}
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
