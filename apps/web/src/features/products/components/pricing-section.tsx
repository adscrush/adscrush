"use client"

import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@adscrush/ui/components/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@adscrush/ui/components/input-group"
import { IconAlertTriangle } from "@tabler/icons-react"
import { Controller, useFormContext } from "react-hook-form"

const MAX_PRICE = 999999999.99

/**
 * Sanitizes a raw input string to a valid price string.
 * - Allows only digits and a single decimal point
 * - Enforces max 2 decimal places
 * - Prevents values exceeding MAX_PRICE
 */
function sanitizePriceInput(raw: string): string {
  // Remove all characters except digits and dot
  let sanitized = raw.replace(/[^0-9.]/g, "")

  // Only allow one decimal point
  const parts = sanitized.split(".")
  if (parts.length > 2) {
    sanitized = (parts[0] ?? "") + "." + parts.slice(1).join("")
  }

  // Enforce max 2 decimal places
  if (parts.length === 2 && (parts[1]?.length ?? 0) > 2) {
    sanitized = (parts[0] ?? "") + "." + (parts[1] ?? "").slice(0, 2)
  }

  // Enforce max value
  const numericValue = parseFloat(sanitized)
  if (!isNaN(numericValue) && numericValue > MAX_PRICE) {
    sanitized = MAX_PRICE.toFixed(2)
  }

  return sanitized
}

/**
 * Parses a sanitized string to a number or null.
 */
function parsePrice(value: string): number | null {
  if (value === "" || value === ".") return null
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

export function PricingSection() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext()

  const price = watch("price")
  const compareAtPrice = watch("compareAtPrice")

  const showCompareAtWarning =
    compareAtPrice != null &&
    price != null &&
    compareAtPrice <= price

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium">Pricing</h3>

      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Price */}
          <Field>
            <FieldLabel htmlFor="price">Price</FieldLabel>
            <FieldContent>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <InputGroupText>€</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="price"
                      inputMode="decimal"
                      placeholder="0.00"
                      aria-invalid={!!errors.price}
                      value={field.value != null ? String(field.value) : ""}
                      onChange={(e) => {
                        const sanitized = sanitizePriceInput(e.target.value)
                        field.onChange(parsePrice(sanitized))
                      }}
                      onBlur={field.onBlur}
                    />
                  </InputGroup>
                )}
              />
              <FieldError>
                {errors.price?.message as string | undefined}
              </FieldError>
            </FieldContent>
          </Field>

          {/* Compare-at price */}
          <Field>
            <FieldLabel htmlFor="compareAtPrice">Compare-at price</FieldLabel>
            <FieldContent>
              <Controller
                name="compareAtPrice"
                control={control}
                render={({ field }) => (
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <InputGroupText>€</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="compareAtPrice"
                      inputMode="decimal"
                      placeholder="0.00"
                      aria-invalid={!!errors.compareAtPrice}
                      value={
                        field.value != null ? String(field.value) : ""
                      }
                      onChange={(e) => {
                        const sanitized = sanitizePriceInput(e.target.value)
                        field.onChange(parsePrice(sanitized))
                      }}
                      onBlur={field.onBlur}
                    />
                  </InputGroup>
                )}
              />
              {showCompareAtWarning && (
                <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500">
                  <IconAlertTriangle className="size-3.5" />
                  Compare-at price should be greater than the selling price
                </p>
              )}
              <FieldError>
                {errors.compareAtPrice?.message as string | undefined}
              </FieldError>
            </FieldContent>
          </Field>
        </div>

        {/* Cost per item */}
        <Field>
          <FieldLabel htmlFor="costPerItem">Cost per item</FieldLabel>
          <FieldContent>
            <Controller
              name="costPerItem"
              control={control}
              render={({ field }) => (
                <InputGroup className="max-w-[calc(50%-0.5rem)]">
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>€</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="costPerItem"
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-invalid={!!errors.costPerItem}
                    value={field.value != null ? String(field.value) : ""}
                    onChange={(e) => {
                      const sanitized = sanitizePriceInput(e.target.value)
                      field.onChange(parsePrice(sanitized))
                    }}
                    onBlur={field.onBlur}
                  />
                </InputGroup>
              )}
            />
            <FieldError>
              {errors.costPerItem?.message as string | undefined}
            </FieldError>
          </FieldContent>
        </Field>

      </FieldGroup>
    </div>
  )
}
