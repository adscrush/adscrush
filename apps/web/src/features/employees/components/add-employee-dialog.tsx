"use client"

import { DepartmentSelect } from "@/features/departments/components/department-select"
import type { CreateEmployeeInput } from "@adscrush/shared/validators/employee.schema"
import { createEmployeeSchema } from "@adscrush/shared/validators/employee.schema"
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
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2 } from "@tabler/icons-react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import React, { useState } from "react"
import { Controller, useForm, type SubmitHandler } from "react-hook-form"
import { useCreateEmployee } from "../queries"

interface AddEmployeeDialogProps {
  children?: React.ReactElement
  onOpenChange?: (open: boolean) => void
  onCreated?: () => void
}

export function AddEmployeeDialog({ children, onOpenChange, onCreated }: AddEmployeeDialogProps) {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const createMutation = useCreateEmployee()

  const form = useForm({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      departmentId: undefined,
      role: "employee",
    },
  })

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = form

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
    if (!newOpen) reset()
  }

  const onSubmit: SubmitHandler<CreateEmployeeInput> = async (data) => {
    await createMutation.mutateAsync(data, {
      onSuccess: () => {
        toast.success("Employee created successfully!")
        handleOpenChange(false)
        onCreated?.()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} size="lg">
      <DialogTrigger render={children} />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            Create a new employee account. An email with login instructions will be sent to the employee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="flex flex-row items-start gap-4">
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <Input {...field} id={field.name} placeholder="John Doe" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Email <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      placeholder="john@example.com"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup className="flex flex-row items-start gap-4">
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Password <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <div className="relative flex-1">
                      <Input
                        {...field}
                        id={field.name}
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        aria-invalid={fieldState.invalid}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="departmentId"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Department</FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <DepartmentSelect
                      value={field.value ?? null}
                      onValueChange={field.onChange}
                      placeholder="Select department"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Create Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
