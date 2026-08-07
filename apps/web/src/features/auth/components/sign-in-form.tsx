"use client"

import { env } from "@/env"
import { Icons } from "@/components/icons"
import { getCallbackURL, signIn } from "@/lib/auth/client"
import { TurnstileWidget } from "./turnstile-widget"
import { signInSchema, type SignInForm } from "@adscrush/shared/validators/auth.schema"
import { Button } from "@adscrush/ui/components/button"
import { Checkbox } from "@adscrush/ui/components/checkbox"
import { Input } from "@adscrush/ui/components/input"
import { Label } from "@adscrush/ui/components/label"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { AuthLayout } from "./auth-layout"

const turnstileSiteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** True when captcha is deployed (site key configured in the web app). */
const captchaEnabled = Boolean(turnstileSiteKey)

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  // Bumped after a failed attempt to force a fresh widget (tokens are single-use).
  const [captchaResetKey, setCaptchaResetKey] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"
  const callbackUrl = getCallbackURL(rawCallbackUrl)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn.social(
        {
          provider: "google",
          callbackURL: callbackUrl,
        },
        {
          onSuccess: () => {
            toast.success("Signed in successfully!")
            router.push(callbackUrl)
          },
          onError: (error) => {
            toast.error(error.error.message || "Failed to sign in with Google")
          },
        }
      )
    } catch {
      toast.error("Failed to sign in with Google")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const onSubmit = async (data: SignInForm) => {
    if (captchaEnabled && !captchaToken) {
      toast.error("Please complete the security check")
      return
    }

    try {
      const { error } = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: callbackUrl,
        fetchOptions: captchaEnabled && captchaToken
          ? {
              headers: {
                "x-captcha-response": captchaToken,
              },
            }
          : undefined,
      })

      // The captcha token is single-use — clear it and remount the widget so
      // a retry after a failed attempt requires a fresh solve.
      setCaptchaToken(null)
      setCaptchaResetKey((k) => k + 1)

      if (error) {
        toast.error(error.message || "Invalid email or password")
      } else {
        toast.success("Signed in successfully!")
        router.push(callbackUrl)
      }
    } catch {
      setCaptchaToken(null)
      setCaptchaResetKey((k) => k + 1)
      toast.error("An unexpected error occurred")
    }
  }

  const isLoading = isSubmitting || isGoogleLoading

  return (
    <AuthLayout title="Sign In" description="Welcome back to Adscrush.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            {...register("email")}
            disabled={isLoading}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href={`/auth/forgot-password${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              {...register("password")}
              disabled={isLoading}
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
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="rememberMe" {...register("rememberMe")} />
          <Label htmlFor="rememberMe" className="text-sm font-normal">
            Remember me
          </Label>
        </div>

        {turnstileSiteKey && (
          <div>
            <TurnstileWidget
              key={captchaResetKey}
              siteKey={turnstileSiteKey}
              onVerify={setCaptchaToken}
            />
          </div>
        )}

        <Button
          className="w-full"
          type="submit"
          disabled={isLoading || (captchaEnabled && !captchaToken)}
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="flex w-full items-center justify-center">
        <div className="h-px w-full bg-border" />
        <span className="px-2 text-xs text-muted-foreground">OR</span>
        <div className="h-px w-full bg-border" />
      </div>

      <div className="space-y-2">
        <Button className="w-full" variant="outline" type="button" onClick={handleGoogleSignIn} disabled={isLoading}>
          <Icons.google className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>

        <Button className="w-full" variant="ghost" type="button" asChild disabled={isLoading}>
          <Link
            href={`/auth/magic-link${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          >
            Sign in with Magic Link
          </Link>
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={`/auth/sign-up${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>

      <p className="text-xs text-muted-foreground">
        By signing in, you agree to our{" "}
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
