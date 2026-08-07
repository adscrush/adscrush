"use client"

import { getCallbackURL, signUp } from "@/lib/auth/client"
import { getPasswordStrength } from "@adscrush/shared/utils/password"
import {
  signUpBaseSchema,
  type SignUpForm,
} from "@adscrush/shared/validators/auth.schema"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import { Label } from "@adscrush/ui/components/label"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { AuthLayout } from "./auth-layout"

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"
  const callbackUrl = getCallbackURL(rawCallbackUrl)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(
      signUpBaseSchema.pick({ name: true, email: true, password: true })
    ),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const password = watch("password", "")
  const strength = getPasswordStrength(password)

  const onSubmit = async (data: SignUpForm) => {
    try {
      const { error } = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: callbackUrl,
      })

      if (error) {
        toast.error(error.message || "Failed to create account")
      } else {
        toast.success("Account created successfully!")
        router.push(callbackUrl)
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

  return (
    <AuthLayout title="Create Account" description="Sign up for Adscrush.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            {...register("name")}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            {...register("email")}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              {...register("password")}
              disabled={isSubmitting}
              autoComplete="off"
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

        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/auth/sign-in${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <a className="underline underline-offset-4 hover:text-primary" href="#">
          Terms of Service
        </a>{" "}
        and{" "}
        <a className="underline underline-offset-4 hover:text-primary" href="#">
          Privacy Policy
        </a>
        .
      </p>
    </AuthLayout>
  )
}
