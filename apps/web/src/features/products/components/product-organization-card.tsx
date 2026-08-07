"use client"

import { useAdvertiserSearch } from "@/features/search/queries"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@adscrush/ui/components/card"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@adscrush/ui/components/combobox"
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@adscrush/ui/components/field"
import { Button } from "@adscrush/ui/components/button"
import { IconLoader2, IconSelector } from "@tabler/icons-react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import * as React from "react"
import { Controller, useFormContext } from "react-hook-form"

export function ProductOrganizationCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product organization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vendor (Advertiser) */}
        <VendorField />
      </CardContent>
    </Card>
  )
}

// --- Vendor (Advertiser) Field ---

function VendorField() {
  const { control } = useFormContext()
  const [q, setQ] = React.useState("")

  const [debouncedQuery, debouncer] = useDebouncedValue(
    q,
    { wait: 500 },
    (state) => ({ isPending: state.isPending })
  )

  const {
    data: advertisers = [],
    isLoading: isQueryLoading,
    isFetching,
  } = useAdvertiserSearch(debouncedQuery)

  const isLoading = isQueryLoading || debouncer.state.isPending || isFetching

  return (
    <Controller
      name="advertiserId"
      control={control}
      render={({ field, fieldState }) => {
        const selectedAdvertiser = advertisers.find(
          (a) => a.id === field.value
        )

        return (
          <Field orientation="vertical" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="vendor-select">Vendor</FieldLabel>
            <FieldContent>
              <Combobox
                autoHighlight
                items={advertisers}
                value={selectedAdvertiser ?? null}
                itemToStringValue={(adv) => adv.name}
                onValueChange={(adv) => field.onChange(adv?.id ?? "")}
              >
                <ComboboxTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                      id="vendor-select"
                    >
                      {selectedAdvertiser ? (
                        <span className="truncate">
                          {selectedAdvertiser.name}
                        </span>
                      ) : (
                        <span className="truncate text-muted-foreground">
                          Select vendor...
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
                <ComboboxContent className="min-w-0">
                  <div className="w-full p-1.5">
                    <ComboboxInput
                      className="min-w-0 rounded-md"
                      placeholder="Search advertiser..."
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
                      "No results found."
                    )}
                  </ComboboxEmpty>
                  <ComboboxList>
                    {(adv: { id: string; name: string }) => (
                      <ComboboxItem key={adv.id} value={adv}>
                        <span className="truncate text-xs font-medium">
                          {adv.name}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </FieldContent>
          </Field>
        )
      }}
    />
  )
}


