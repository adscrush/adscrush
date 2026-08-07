"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Field, FieldError, FieldLabel } from "@adscrush/ui/components/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@adscrush/ui/components/select"
import { Button } from "@adscrush/ui/components/button"
import { Card, CardContent } from "@adscrush/ui/components/card"
import { IconLoader2 } from "@tabler/icons-react"
import { useUpdateEmployeeAccess, type Employee } from "../queries"
import { getInitials } from "@adscrush/shared/lib/initials"
import { toast } from "@adscrush/ui/sonner"
import {
  ACCESS_LEVEL,
  ACCESS_LEVEL_VALUES,
  type AccessLevel,
} from "@adscrush/shared/constants/status"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  useComboboxAnchor,
} from "@adscrush/ui/components/combobox"
import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import { useAdvertiserSearch, useMediaBuyerSearch } from "@/features/search/queries"
import { useDebouncedValue } from "@tanstack/react-pacer"

const employeeAccessFormSchema = z.object({
  advertiserAccess: z.enum(ACCESS_LEVEL_VALUES),
  mediaBuyerAccess: z.enum(ACCESS_LEVEL_VALUES),
  advertiserIds: z.array(z.string()).default([]),
  mediaBuyerIds: z.array(z.string()).default([]),
  managedAdvertiserIds: z.array(z.string()).default([]),
  managedMediaBuyerIds: z.array(z.string()).default([]),
})

type EmployeeAccessFormValues = z.infer<typeof employeeAccessFormSchema>

interface EmployeeAccessFormProps {
  employee: Employee
}

export function EmployeeAccessForm({ employee }: EmployeeAccessFormProps) {
  const updateAccess = useUpdateEmployeeAccess()

  const form = useForm({
    resolver: zodResolver(employeeAccessFormSchema),
    defaultValues: {
      advertiserAccess: (employee.advertiserAccess as AccessLevel) || ACCESS_LEVEL.ALL,
      mediaBuyerAccess: (employee.mediaBuyerAccess as AccessLevel) || ACCESS_LEVEL.ALL,
      advertiserIds: (employee.assignedAdvertisers || []).map((a) => a.id),
      mediaBuyerIds: (employee.assignedMediaBuyers || []).map((a) => a.id),
      managedAdvertiserIds: (employee.managedAdvertisers || []).map((a) => a.id),
      managedMediaBuyerIds: (employee.managedMediaBuyers || []).map((a) => a.id),
    },
  })

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = form

  const advertiserAccess = watch("advertiserAccess")
  const mediaBuyerAccess = watch("mediaBuyerAccess")

  async function onSubmit(values: EmployeeAccessFormValues) {
    try {
      await updateAccess.mutateAsync({
        id: employee.id,
        advertiserAccess: values.advertiserAccess,
        mediaBuyerAccess: values.mediaBuyerAccess,
        advertiserIds: values.advertiserIds,
        mediaBuyerIds: values.mediaBuyerIds,
        managedAdvertiserIds: values.managedAdvertiserIds,
        managedMediaBuyerIds: values.managedMediaBuyerIds,
      })
      toast.success("Employee access updated successfully")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update employee access")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel>Advertisers Access</FieldLabel>
              <Controller
                name="advertiserAccess"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select access" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ACCESS_LEVEL.ALL}>All Advertisers</SelectItem>
                      <SelectItem value={ACCESS_LEVEL.SELECTED}>Selected Only</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.advertiserAccess]} />
            </Field>

            <Field>
              <FieldLabel>Media Buyers Access</FieldLabel>
              <Controller
                name="mediaBuyerAccess"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select access" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ACCESS_LEVEL.ALL}>All Media Buyers</SelectItem>
                      <SelectItem value={ACCESS_LEVEL.SELECTED}>Selected Only</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.mediaBuyerAccess]} />
            </Field>
          </div>

          <div className="space-y-6 border-t border-muted/50 pt-6">
            <h3 className="text-sm font-medium">Assigned Entities (Account Manager)</h3>

            <div className="space-y-4">
              <Field>
                <FieldLabel>Assigned Advertisers :</FieldLabel>
                <Controller
                  name="managedAdvertiserIds"
                  control={control}
                  render={({ field }) => (
                    <EntityMultiSelect
                      type="advertiser"
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder="Select Advertiser"
                      initialData={employee.managedAdvertisers}
                    />
                  )}
                />
                <FieldError errors={[errors.managedAdvertiserIds]} />
              </Field>

              <Field>
                <FieldLabel>Assigned Media Buyers :</FieldLabel>
                <Controller
                  name="managedMediaBuyerIds"
                  control={control}
                  render={({ field }) => (
                    <EntityMultiSelect
                      type="media_buyer"
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder="Select Media Buyer"
                      initialData={employee.managedMediaBuyers}
                    />
                  )}
                />
                <FieldError errors={[errors.managedMediaBuyerIds]} />
              </Field>
            </div>
          </div>

          <div className="space-y-6 border-t border-muted/50 pt-6">
            <h3 className="text-sm font-medium">Access Control (Authorization)</h3>

            <div className="space-y-4">
              <Field className={advertiserAccess === ACCESS_LEVEL.ALL ? "pointer-events-none opacity-50" : ""}>
                <FieldLabel>Authorized Advertisers :</FieldLabel>
                <Controller
                  name="advertiserIds"
                  control={control}
                  render={({ field }) => (
                    <EntityMultiSelect
                      type="advertiser"
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder="Select Advertiser"
                      disabled={advertiserAccess === ACCESS_LEVEL.ALL}
                      initialData={employee.assignedAdvertisers}
                    />
                  )}
                />
                <FieldError errors={[errors.advertiserIds]} />
              </Field>

              <Field className={mediaBuyerAccess === ACCESS_LEVEL.ALL ? "pointer-events-none opacity-50" : ""}>
                <FieldLabel>Authorized Media Buyers :</FieldLabel>
                <Controller
                  name="mediaBuyerIds"
                  control={control}
                  render={({ field }) => (
                    <EntityMultiSelect
                      type="media_buyer"
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder="Select Media Buyer"
                      disabled={mediaBuyerAccess === ACCESS_LEVEL.ALL}
                      initialData={employee.assignedMediaBuyers}
                    />
                  )}
                />
                <FieldError errors={[errors.mediaBuyerIds]} />
              </Field>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={updateAccess.isPending}>
              {updateAccess.isPending && (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

function EntityMultiSelect({
  type,
  value,
  onValueChange,
  placeholder,
  disabled,
  initialData = [],
}: {
  type: "advertiser" | "media_buyer"
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder: string
  disabled?: boolean
  initialData?: { id: string; name: string; image?: string | null; companyName?: string | null }[]
}) {
  const [q, setQ] = React.useState("")
  const [debouncedQuery, debouncer] = useDebouncedValue(q, { wait: 500 }, (state) => ({ isPending: state.isPending }))

  const advertiserSearch = useAdvertiserSearch(debouncedQuery)
  const affiliateSearch = useMediaBuyerSearch(debouncedQuery)

  const searchResult = type === "advertiser" ? advertiserSearch : affiliateSearch
  const entities = React.useMemo(() => searchResult.data || [], [searchResult.data])
  const isLoading = searchResult.isLoading || debouncer.state.isPending || searchResult.isFetching

  // Keep track of selected entities to show their names
  // Initialize with initialData from server
  const [selectedEntities, setSelectedEntities] = React.useState(initialData)

  // Also sync with new entities from search
  React.useEffect(() => {
    if (entities.length > 0) {
      const newSelected = entities.filter((e) => value.includes(e.id))
      setSelectedEntities((prev) => {
        const prevIds = prev.map((p) => p.id)
        const toAdd = newSelected.filter((n) => !prevIds.includes(n.id))
        return [...prev, ...toAdd]
      })
    }
  }, [entities, value])

  const currentSelected = selectedEntities.filter((e) => value.includes(e.id))

  // Anchor the popover to the chips wrapper so it doesn't shift as chips grow
  const anchorRef = useComboboxAnchor()

  return (
    <div ref={anchorRef} className="relative">
      <Combobox
        multiple
        value={currentSelected}
        onValueChange={(vals) => {
          onValueChange(vals.map((v) => v.id))
        }}
        isItemEqualToValue={(item, val) => item.id === val.id}
        disabled={disabled}
      >
        <ComboboxChips className="min-h-10">
          {currentSelected.map((entity) => (
            <ComboboxChip key={entity.id} className="h-auto py-0.5">
              <div className="flex flex-col leading-tight">
                <span>{entity.name}</span>
                <span className="block h-3 text-[10px] font-normal text-muted-foreground leading-3">
                  {entity.companyName ?? ""}
                </span>
              </div>
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            placeholder={value.length === 0 ? placeholder : ""}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {isLoading && <IconLoader2 className="mr-2 ml-auto size-3 animate-spin" />}
        </ComboboxChips>

        <ComboboxContent anchor={anchorRef}>
          {!isLoading && entities.length === 0 && (
            <ComboboxEmpty>No results found.</ComboboxEmpty>
          )}
          <ComboboxList>
            {entities.map((entity) => (
              <ComboboxItem key={entity.id} value={entity}>
                <Avatar className="size-6 shrink-0">
                  <AvatarImage src={entity.image ?? undefined} alt={entity.name} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(entity.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{entity.name}</span>
                  {'companyName' in entity ? (
                    <span className="truncate text-[10px] text-muted-foreground">{entity.companyName as string}</span>
                  ) : null}
                </div>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
