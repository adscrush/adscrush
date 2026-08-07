"use client"

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
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2 } from "@tabler/icons-react"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import type { Category } from "../queries"
import { useUpdateCategory } from "../queries"

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

type EditCategoryInput = z.infer<typeof updateCategorySchema>

interface UpdateCategoryDialogProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Dialog>,
  "children"
> {
  category: Category | null
}

export function UpdateCategoryDialog({
  category,
  open,
  onOpenChange,
}: UpdateCategoryDialogProps) {
  const updateMutation = useUpdateCategory()

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
    },
  })

  React.useEffect(() => {
    if (open && category) {
      reset({
        name: category.name,
        description: category.description || "",
      })
    }
    // Intentionally keyed on the entity id, not the object identity: refetches
    // create a new object every time, which would reset in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category?.id])

  const onSubmit = async (data: EditCategoryInput) => {
    if (!category) return

    await updateMutation.mutateAsync(
      { id: category.id, ...data },
      {
        onSuccess: () => {
          toast.success("Category updated")
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
    <Dialog open={open} onOpenChange={onOpenChange} key={category?.id}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Update category details.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 pt-4"
        >
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Field orientation="vertical">
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <FieldContent>
                  <textarea
                    {...field}
                    id={field.name}
                    rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
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
