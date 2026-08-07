"use client"

import { getCallbackURL, resetPassword } from "@/lib/auth/client"
import { getPasswordStrength } from "@adscrush/shared/utils/password"
import {
  resetPasswordSchema,
  type ResetPasswordForm,
} from "@adscrush/shared/validators/auth.schema"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import { Label } from "@adscrush/ui/components/label"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircleIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { AuthLayout } from "./auth-layout"

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const rawCallbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const callbackUrl = getCallbackURL(rawCallbackUrl)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const password = watch("password", "")
  const strength = getPasswordStrength(password)

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error("Invalid or missing reset token")
      return
    }

    try {
      const { error } = await resetPassword({
        newPassword: data.password,
        token,
      })

      if (error) {
        toast.error(error.message || "Failed to reset password")
      } else {
        toast.success("Password reset successfully!")
        router.push(
          `/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
        )
      }
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  const requirements = [
    { key: "hasMinLength", label: "At least 8 characters" },
    { key: "hasUppercase", label: "One uppercase letter" },
    { key: "hasLowercase", label: "One lowercase letter" },
    { key: "hasNumber", label: "One number" },
    { key: "hasSpecialChar", label: "One special character" },
  ] as const

  if (!token) {
    return (
      <AuthLayout
        title="Invalid Link"
        description="This password reset link is invalid or has expired."
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircleIcon className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground">
                The password reset link you clicked is either invalid or has
                expired.
              </p>
            </div>
          </div>

          <Button className="w-full" asChild>
            <Link href="/auth/forgot-password">Request New Reset Link</Link>
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/auth/sign-in"
              className="text-primary underline-offset-4 hover:underline"
            >
              Back to Sign In
            </Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create New Password"
      description="Enter your new password below."
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              {...register("password")}
              disabled={isSubmitting}
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
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}

          {password && (
            <div className="mt-2 space-y-1">
              {requirements.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  {strength[key] ? (
                    <CheckIcon className="h-3 w-3 text-green-500" />
                  ) : (
                    <XIcon className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span
                    className={
                      strength[key] ? "text-green-500" : "text-muted-foreground"
                    }
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              {...register("confirmPassword")}
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/auth/sign-in"
          className="text-primary underline-offset-4 hover:underline"
        >
          Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
