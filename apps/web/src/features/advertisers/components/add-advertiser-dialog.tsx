"use client"

import { EmployeeSelect } from "@/features/employees/components/employee-select"
import { ADVERTISER_STATUS } from "@adscrush/shared/constants/status"
import type { CreateAdvertiserInput } from "@adscrush/shared/validators/advertiser.schema"
import { createAdvertiserSchema } from "@adscrush/shared/validators/advertiser.schema"
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
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
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
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconKey, IconLoader2 } from "@tabler/icons-react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import React, { useState } from "react"
import { Controller, useForm, type SubmitHandler } from "react-hook-form"
import { useCreateAdvertiser } from "../queries"

function generatePassword(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  return Array.from({ length: 12 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("")
}

interface AddAdvertiserDialogProps {
  children?: React.ReactElement
  onOpenChange?: (open: boolean) => void
  onCreated?: () => void
}

export function AddAdvertiserDialog({
  children,
  onOpenChange,
  onCreated,
}: AddAdvertiserDialogProps) {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const createMutation = useCreateAdvertiser()

  const form = useForm({
    resolver: zodResolver(createAdvertiserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      companyName: "",
      status: "active",
      accountManagerId: "",
    },
  })

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = form

  const currentStatus = watch("status")

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
    if (!newOpen) reset()
  }

  const onSubmit: SubmitHandler<CreateAdvertiserInput> = async (data) => {
    await createMutation.mutateAsync(
      {
        ...data,
        accountManagerId: data.accountManagerId,
        website: data.website || undefined,
        companyName: data.companyName || undefined,
        country: data.country || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Advertiser created successfully!")
          handleOpenChange(false)
          onCreated?.()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  const handleGeneratePassword = () => {
    const password = generatePassword()
    setValue("password", password, { shouldValidate: true, shouldDirty: true })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} size="lg">
      <DialogTrigger render={children} />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Advertiser</DialogTitle>
          <DialogDescription>
            Add a new advertiser to your network
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="flex flex-row items-start gap-4">
            {/* ── Name ── */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="">
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Advertiser name"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                </Field>
              )}
            />
            {/* ── Company ── */}
            <Controller
              name="companyName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="">
                    Company (Brand)
                  </FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Company"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          {/* ── Email ── */}
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="">
                  Email <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent className="w-full flex-1">
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="test@example.com"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="">
                  Password <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <div className="flex w-full flex-1 flex-row gap-2">
                    <div className="relative flex-1">
                      <Input
                        {...field}
                        id={field.name}
                        type={showPassword ? "text" : "password"}
                        aria-invalid={fieldState.invalid}
                        placeholder="Password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleGeneratePassword}
                      className="shrink-0"
                    >
                      <IconKey className="mr-1 size-3.5" />
                      Generate
                    </Button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
              </Field>
            )}
          />

          {/* ── Account Manager (Combobox) ── */}
          <FieldGroup className="flex flex-row items-start gap-4">
            <Controller
              name="accountManagerId"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field
                    orientation="vertical"
                    data-invalid={fieldState.invalid}
                  >
                    <FieldLabel htmlFor={field.name}>
                      Account Manager
                    </FieldLabel>
                    <FieldContent>
                      <EmployeeSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </FieldContent>
                  </Field>
                )
              }}
            />

            {/* ── Status ── */}
            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <FieldContent>
                    <Select
                      value={currentStatus}
                      onValueChange={(value) =>
                        setValue(
                          "status",
                          value as CreateAdvertiserInput["status"]
                        )
                      }
                    >
                      <SelectTrigger className="w-full" {...field}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ADVERTISER_STATUS).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>
          {/* ── Submit ── */}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
            >
              {isSubmitting || createMutation.isPending ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Advertiser"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
