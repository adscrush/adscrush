"use client"

import { trpc } from "@/lib/trpc/client"
import { CategorySelect } from "@/features/categories/components/category-select"
import { Alert, AlertDescription } from "@adscrush/ui/components/alert"
import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adscrush/ui/components/select"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import {
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react"
import * as React from "react"
import { Controller, useFormContext } from "react-hook-form"
import { useCategories } from "@/features/categories/queries"

interface MetafieldOption {
  label: string
  value: string
}

interface CategoryMetafieldDef {
  id: string
  name: string
  type: "text" | "number" | "select" | "multiselect" | "color"
  options: MetafieldOption[] | null
  required: boolean
  position: number
}

export function CategorySection() {
  const { control, setValue, watch } = useFormContext()
  const categoryId = watch("categoryId")
  const metafieldValues = watch("metafieldValues") as Record<string, string>

  // Fetch categories list (for metafield loading state only)
  const {
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useCategories({
    search: "",
    filterFlag: "commandFilters",
    page: 1,
    perPage: 100,
    sort: [{ id: "name", desc: false }],
    filters: [],
    joinOperator: "and",
  })

  // Fetch metafields for the selected category
  const {
    data: metafields,
    isLoading: isMetafieldsLoading,
    isError: isMetafieldsError,
    refetch: refetchMetafields,
  } = trpc.categories.metafields.useQuery(
    { categoryId: categoryId || "" },
    { enabled: !!categoryId }
  )

  // Handle metafield value change
  const handleMetafieldChange = React.useCallback(
    (metafieldId: string, value: string) => {
      setValue(
        "metafieldValues",
        { ...metafieldValues, [metafieldId]: value },
        { shouldDirty: true }
      )
    },
    [metafieldValues, setValue]
  )

  // Handle multiselect toggle
  const handleMultiselectToggle = React.useCallback(
    (metafieldId: string, optionValue: string) => {
      const current = metafieldValues[metafieldId] ?? ""
      const currentValues = current ? current.split(",") : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue]
      handleMetafieldChange(metafieldId, newValues.join(","))
    },
    [metafieldValues, handleMetafieldChange]
  )

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium">Category</h3>

      {/* Categories error state */}
      {isCategoriesError && (
        <Alert variant="destructive" className="mb-4">
          <IconAlertCircle className="size-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load categories.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchCategories()}
              className="ml-2 h-6 gap-1 px-2 text-xs"
            >
              <IconRefresh className="size-3" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Category combobox */}
      <Controller
        name="categoryId"
        control={control}
        render={({ field, fieldState }) => (
          <Field orientation="vertical" data-invalid={fieldState.invalid}>
            <FieldLabel>Product category</FieldLabel>
            <FieldContent>
              <CategorySelect
                value={field.value ?? null}
                onValueChange={(v) => {
                  field.onChange(v ?? "")
                  setValue("metafieldValues", {}, { shouldDirty: true })
                }}
                disabled={isCategoriesError}
              />
            </FieldContent>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {/* Dynamic metafields */}
      {categoryId && (
        <div className="mt-4 space-y-3">
          {isMetafieldsLoading && (
            <div className="space-y-3">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-full" />
            </div>
          )}

          {isMetafieldsError && (
            <Alert variant="destructive">
              <IconAlertCircle className="size-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Failed to load category fields.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetchMetafields()}
                  className="ml-2 h-6 gap-1 px-2 text-xs"
                >
                  <IconRefresh className="size-3" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {metafields && metafields.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground">
                Category-specific fields
              </p>
              {(metafields as CategoryMetafieldDef[]).map((metafield) => (
                <MetafieldInput
                  key={metafield.id}
                  metafield={metafield}
                  value={metafieldValues[metafield.id] ?? ""}
                  onChange={(value) =>
                    handleMetafieldChange(metafield.id, value)
                  }
                  onMultiselectToggle={(optionValue) =>
                    handleMultiselectToggle(metafield.id, optionValue)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Metafield Input Renderer ─────────────────────────────────────────────────

interface MetafieldInputProps {
  metafield: CategoryMetafieldDef
  value: string
  onChange: (value: string) => void
  onMultiselectToggle: (optionValue: string) => void
}

function MetafieldInput({
  metafield,
  value,
  onChange,
  onMultiselectToggle,
}: MetafieldInputProps) {
  const options = (metafield.options ?? []) as MetafieldOption[]

  switch (metafield.type) {
    case "text":
      return (
        <Field orientation="vertical">
          <FieldLabel>
            {metafield.name}
            {metafield.required && (
              <span className="text-destructive"> *</span>
            )}
          </FieldLabel>
          <FieldContent>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${metafield.name.toLowerCase()}`}
            />
          </FieldContent>
        </Field>
      )

    case "number":
      return (
        <Field orientation="vertical">
          <FieldLabel>
            {metafield.name}
            {metafield.required && (
              <span className="text-destructive"> *</span>
            )}
          </FieldLabel>
          <FieldContent>
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${metafield.name.toLowerCase()}`}
            />
          </FieldContent>
        </Field>
      )

    case "select":
      return (
        <Field orientation="vertical">
          <FieldLabel>
            {metafield.name}
            {metafield.required && (
              <span className="text-destructive"> *</span>
            )}
          </FieldLabel>
          <FieldContent>
            <Select value={value || undefined} onValueChange={onChange}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={`Select ${metafield.name.toLowerCase()}`}
                />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
      )

    case "multiselect": {
      const selectedValues = value ? value.split(",") : []
      return (
        <Field orientation="vertical">
          <FieldLabel>
            {metafield.name}
            {metafield.required && (
              <span className="text-destructive"> *</span>
            )}
          </FieldLabel>
          <FieldContent>
            <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-input/20 p-2">
              {options.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No options available
                </span>
              )}
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <Badge
                    key={option.value}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer select-none text-xs"
                    onClick={() => onMultiselectToggle(option.value)}
                  >
                    {option.label}
                  </Badge>
                )
              })}
            </div>
          </FieldContent>
        </Field>
      )
    }

    case "color":
      return (
        <Field orientation="vertical">
          <FieldLabel>
            {metafield.name}
            {metafield.required && (
              <span className="text-destructive"> *</span>
            )}
          </FieldLabel>
          <FieldContent>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value || "#000000"}
                onChange={(e) => onChange(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-input"
              />
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </FieldContent>
        </Field>
      )

    default:
      return null
  }
}
