"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@adscrush/ui/components/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adscrush/ui/components/dialog"
import { useCreateCategory } from "../queries"
import { toast } from "@adscrush/ui/sonner"
import { IconDeviceFloppy } from "@tabler/icons-react"

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

type CreateCategoryInput = z.infer<typeof createCategorySchema>

interface AddCategoryDialogProps {
  children: React.ReactNode
}

export function AddCategoryDialog({ children }: AddCategoryDialogProps) {
  const [open, setOpen] = React.useState(false)
  const createCategory = useCreateCategory()

  const form = useForm({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const onSubmit = async (data: CreateCategoryInput) => {
    try {
      await createCategory.mutateAsync(data)
      toast.success("Category created successfully")
      setOpen(false)
      form.reset()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create category")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for your offers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Category Name *</FieldLabel>
                  <FieldContent>
                    <Input {...field} placeholder="e.g. E-commerce, Gaming" />
                    <FieldError />
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Description (Optional)</FieldLabel>
                  <FieldContent>
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Brief description..."
                    />
                  </FieldContent>
                </Field>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="gap-2"
              disabled={createCategory.isPending}
            >
              {createCategory.isPending ? (
                "Creating..."
              ) : (
                <>
                  Create Category <IconDeviceFloppy className="size-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
