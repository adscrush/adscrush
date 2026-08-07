"use client"

import type { CreateLanguageInput } from "@adscrush/shared/validators/language.schema"
import { createLanguageSchema } from "@adscrush/shared/validators/language.schema"
import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adscrush/ui/components/dialog"
import { Field, FieldContent, FieldError, FieldLabel } from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2 } from "@tabler/icons-react"
import React, { useState } from "react"
import { Controller, useForm, type SubmitHandler } from "react-hook-form"
import { useCreateLanguage } from "../queries"

interface AddLanguageDialogProps {
  children?: React.ReactElement
  onOpenChange?: (open: boolean) => void
  onCreated?: () => void
}

export function AddLanguageDialog({
  children,
  onOpenChange,
  onCreated,
}: AddLanguageDialogProps) {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateLanguage()

  const form = useForm({
    resolver: zodResolver(createLanguageSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
    if (!newOpen) reset()
  }

  const onSubmit: SubmitHandler<CreateLanguageInput> = async (data) => {
    await createMutation.mutateAsync(data, {
      onSuccess: () => {
        toast.success("Language created successfully!")
        handleOpenChange(false)
        onCreated?.()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Language</DialogTitle>
          <DialogDescription>Add a new language to the system</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Name <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. English, Spanish, Tamil"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Code <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. en, es, ta"
                    className="font-mono"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              {isSubmitting || createMutation.isPending ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Language"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
