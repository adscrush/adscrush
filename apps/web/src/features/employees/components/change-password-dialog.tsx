"use client"

import { changeEmployeePasswordSchema } from "@adscrush/shared/validators/employee.schema"
import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@adscrush/ui/components/dialog"
import { Field, FieldError, FieldLabel } from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2, IconEye, IconEyeOff, IconRefresh } from "@tabler/icons-react"
import { useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import type { Employee } from "../queries"
import { useChangeEmployeePassword } from "../queries"
import { getInitials } from "../utils"
import type { z } from "zod"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

type ChangePasswordInput = z.infer<typeof changeEmployeePasswordSchema>

function generatePassword(length = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export function ChangePasswordDialog({ open, onOpenChange, employee }: ChangePasswordDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const changePasswordMutation = useChangeEmployeePassword()

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changeEmployeePasswordSchema),
    defaultValues: {
      password: "",
    },
  })

  const {
    handleSubmit,
    reset,
    register,
    setValue,
    formState: { isSubmitting },
  } = form

  const handleGeneratePassword = () => {
    const pwd = generatePassword()
    setValue("password", pwd, { shouldValidate: true })
    setShowPassword(true)
    navigator.clipboard.writeText(pwd).catch(() => {})
    toast.info("Password generated and copied to clipboard")
  }

  const onSubmit: SubmitHandler<ChangePasswordInput> = async (data) => {
    if (!employee) return

    await changePasswordMutation.mutateAsync(
      { id: employee.id, ...data },
      {
        onSuccess: () => {
          toast.success("Password changed successfully!")
          reset()
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) reset()
        onOpenChange(val)
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Set a new password for {employee?.name}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Employee identity card */}
          <div className="flex items-center gap-3 rounded-md bg-muted p-3">
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={undefined} alt={employee?.name ?? ""} />
              <AvatarFallback className="text-sm font-semibold">
                {getInitials(employee?.name ?? "")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{employee?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{employee?.email}</p>
            </div>
          </div>

          <Field>
            <FieldLabel>New Password</FieldLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <IconEyeOff className="size-4 text-muted-foreground" />
                  ) : (
                    <IconEye className="size-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Generate password"
                onClick={handleGeneratePassword}
              >
                <IconRefresh className="size-4" />
              </Button>
            </div>
            <FieldError />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
