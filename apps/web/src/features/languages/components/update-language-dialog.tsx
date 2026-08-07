"use client"

import { updateLanguageSchema } from "@adscrush/shared/validators/language.schema"
import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  createDialogCloseEvent,
} from "@adscrush/ui/components/dialog"
import { Field, FieldContent, FieldError, FieldLabel } from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2 } from "@tabler/icons-react"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod"
import type { Language } from "../queries"
import { useUpdateLanguage } from "../queries"

type EditLanguageInput = z.infer<typeof updateLanguageSchema>

interface UpdateLanguageDialogProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Dialog>, "children"> {
  language: Language | null
}

export function UpdateLanguageDialog({
  language,
  open,
  onOpenChange,
}: UpdateLanguageDialogProps) {
  const updateMutation = useUpdateLanguage()

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(updateLanguageSchema),
    defaultValues: {
      name: language?.name || "",
      code: language?.code || "",
    },
  })

  React.useEffect(() => {
    if (open && language) {
      reset({
        name: language.name,
        code: language.code,
      })
    }
    // Intentionally keyed on the entity id, not the object identity: refetches
    // create a new object every time, which would reset in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, language?.id])

  const onSubmit = async (data: EditLanguageInput) => {
    if (!language) return

    await updateMutation.mutateAsync(
      { id: language.id, ...data },
      {
        onSuccess: () => {
          toast.success("Language updated")
          onOpenChange?.(false, createDialogCloseEvent())
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  const isLoading = updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={language?.id}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Language</DialogTitle>
          <DialogDescription>Update language details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-4">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <FieldContent>
                  <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="code"
            control={control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Code</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    className="font-mono"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={isLoading} type="button">
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
