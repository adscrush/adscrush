"use client"

import { getCallbackURL, requestPasswordReset } from "@/lib/auth/client"
import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from "@adscrush/shared/validators/auth.schema"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import { Label } from "@adscrush/ui/components/label"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircleIcon, MailIcon } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { AuthLayout } from "./auth-layout"

export function ForgotPasswordForm() {
  const [emailSent, setEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  const searchParams = useSearchParams()
  const rawCallbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"
  const callbackUrl = getCallbackURL(rawCallbackUrl)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      const { error } = await requestPasswordReset({
        email: data.email,
        redirectTo: getCallbackURL(
          `/auth/reset-password?callbackUrl=${encodeURIComponent(rawCallbackUrl)}`
        ),
      })

      if (error) {
        toast.error(error.message || "Failed to send reset email")
      } else {
        setSentEmail(data.email)
        setEmailSent(true)
        toast.success("Reset link sent to your email!")
      }
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  const handleResend = async () => {
    if (!sentEmail) return
    try {
      const { error } = await requestPasswordReset({
        email: sentEmail,
        redirectTo: getCallbackURL(
          `/auth/reset-password?callbackUrl=${encodeURIComponent(rawCallbackUrl)}`
        ),
      })

      if (error) {
        toast.error(error.message || "Failed to resend email")
      } else {
        toast.success("Reset link sent again!")
      }
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  if (emailSent) {
    return (
      <AuthLayout
        title="Check Your Email"
        description="We've sent you a password reset link."
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to
              </p>
              <p className="font-medium">{sentEmail}</p>
            </div>
          </div>

          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Click the link in your email to reset your password. The link will
              expire in 15 minutes.
            </p>
            <p>Don&apos;t see the email? Check your spam folder.</p>
          </div>

          <Button className="w-full" variant="outline" onClick={handleResend}>
            <MailIcon className="mr-2 h-4 w-4" />
            Resend Email
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href={`/auth/sign-in${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
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
      title="Reset Password"
      description="Enter your email to receive a reset link."
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            {...register("email")}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href={`/auth/sign-in${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
