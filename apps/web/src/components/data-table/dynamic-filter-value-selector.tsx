"use client"

import { Check } from "lucide-react"
import { cn } from "@adscrush/ui/lib/utils"
import {
  CommandGroup,
  CommandItem,
} from "@adscrush/ui/components/command"
import { Avatar, AvatarFallback } from "@adscrush/ui/components/avatar"
import { getInitials } from "@adscrush/shared/lib/initials"
import {
  useFilterResource,
  type UseFilterResourceOptions,
} from "./hooks/use-filter-resource"

interface DynamicFilterValueSelectorProps extends UseFilterResourceOptions {
  resourceType: string
  onSelect: (value: string) => void
}

/**
 * Renders the list of filter-value options inside the command popover.
 *
 * The heavy lifting (which tRPC queries to call, how to map raw data,
 * debouncing, merging selected + search results) lives in the
 * `useFilterResource` hook — this component only handles presentation.
 */
export function DynamicFilterValueSelector({
  resourceType,
  onSelect,
  ...hookOptions
}: DynamicFilterValueSelectorProps) {
  const {
    mergedResults,
    isLoading,
    config,
  } = useFilterResource(resourceType, hookOptions)

  const { selectedValues, searchQuery } = hookOptions

  const hasAnythingToShow = mergedResults.length > 0

  return (
    <CommandGroup>
      {isLoading && !hasAnythingToShow ? (
        <CommandItem disabled value="__loading__">
          <span className="text-xs text-muted-foreground">Loading...</span>
        </CommandItem>
      ) : !isLoading && !hasAnythingToShow ? (
        <CommandItem disabled value="__empty__">
          <span className="text-xs text-muted-foreground">
            {searchQuery
              ? `No ${resourceType} found matching "${searchQuery}"`
              : `No ${resourceType} found`}
          </span>
        </CommandItem>
      ) : null}
      {mergedResults.map((item) => {
        const isSelected = selectedValues.includes(item.id)
        const hasImage = item.image
        const useAvatar = config?.useAvatar

        return (
          <CommandItem
            key={item.id}
            value={item.id}
            keywords={[item.name]}
            onSelect={() => onSelect(item.id)}
            className={cn(isSelected && "bg-accent/50")}
          >
            {useAvatar ? (
              <Avatar className="size-5 shrink-0">
                <AvatarFallback className="text-[0.5rem]">
                  {getInitials(item.name)}
                </AvatarFallback>
              </Avatar>
            ) : hasImage ? (
              <img
                src={item.image as string}
                alt=""
                className="size-5 rounded object-cover"
              />
            ) : (
              <div className="flex size-5 items-center justify-center rounded bg-muted text-[8px] font-medium">
                {item.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate text-xs">{item.name}</span>
            <Check
              className={cn(
                "ml-auto size-3",
                isSelected ? "opacity-100" : "opacity-0",
              )}
            />
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}
