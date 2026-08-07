"use client"

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { Controller, useFormContext } from "react-hook-form"

const MAX_TITLE_LENGTH = 255

export function TitleField() {
  const { control } = useFormContext()

  return (
    <Controller
      name="name"
      control={control}
      render={({ field, fieldState }) => (
        <Field orientation="vertical" data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>
            Title <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Short sleeve t-shirt"
              maxLength={MAX_TITLE_LENGTH}
              onBlur={(e) => {
                field.onChange(e.target.value.trim())
                field.onBlur()
              }}
            />
            <div className="flex items-center justify-between">
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {field.value?.length ?? 0}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </FieldContent>
        </Field>
      )}
    />
  )
}
