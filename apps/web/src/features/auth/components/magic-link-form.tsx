"use client"

import { authClient, getCallbackURL, signIn } from "@/lib/auth/client"
import {
  magicLinkRequestSchema,
  type MagicLinkRequestForm,
} from "@adscrush/shared/validators/auth.schema"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@adscrush/ui/components/input-otp"
import { Label } from "@adscrush/ui/components/label"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircleIcon, MailIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { AuthLayout } from "./auth-layout"

export function MagicLinkForm() {
  const [phase, setPhase] = useState<"request" | "verify">("request")
  const [sentEmail, setSentEmail] = useState("")
  const [token, setToken] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"
  const callbackUrl = getCallbackURL(rawCallbackUrl)
  const urlToken = searchParams.get("token")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(magicLinkRequestSchema),
    defaultValues: {
      email: "",
    },
  })

  // Auto-verify if token is in URL — intentionally fires only when the URL
  // token changes (handleVerify is recreated each render, so adding it to deps
  // would cause redundant verification calls).
  useEffect(() => {
    if (urlToken) {
      setToken(urlToken)
      setPhase("verify")
      handleVerify(urlToken)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken])

  const onSubmit = async (data: MagicLinkRequestForm) => {
    try {
      const { error } = await signIn.magicLink({
        email: data.email,
        callbackURL: callbackUrl,
      })

      if (error) {
        toast.error(error.message || "Failed to send magic link")
      } else {
        setSentEmail(data.email)
        setPhase("verify")
        toast.success("Magic link sent to your email!")
      }
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  const handleResend = async () => {
    if (!sentEmail) return
    try {
      const { error } = await signIn.magicLink({
        email: sentEmail,
        callbackURL: callbackUrl,
      })

      if (error) {
        toast.error(error.message || "Failed to resend magic link")
      } else {
        toast.success("Magic link sent again!")
      }
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  // Format token with dash: kn2278955y -> kn227-8955y
  const formatTokenWithDash = (rawToken: string): string => {
    if (rawToken.length !== 10) return rawToken
    return `${rawToken.slice(0, 5)}-${rawToken.slice(5)}`
  }

  const handleVerify = async (verifyToken?: string) => {
    const tokenToVerify = verifyToken || token
    if (!tokenToVerify || tokenToVerify.length !== 10) {
      toast.error("Please enter a valid 10-character code")
      return
    }

    setIsVerifying(true)
    try {
      const formattedToken = formatTokenWithDash(tokenToVerify)
      const { error } = await authClient.magicLink.verify({
        query: {
          token: formattedToken,
          callbackURL: callbackUrl,
        },
      })

      if (error) {
        toast.error(error.message || "Invalid or expired code")
      } else {
        toast.success("Verified successfully!")
        router.push(callbackUrl)
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsVerifying(false)
    }
  }

  if (phase === "verify") {
    return (
      <AuthLayout
        title="Enter Verification Code"
        description="Enter the code from your email or click the link."
      >
        <div className="space-y-4">
          {sentEmail && (
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm text-muted-foreground">
                  We sent a magic link to
                </p>
                <p className="font-medium">{sentEmail}</p>
              </div>
            </div>
          )}

          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Click the link in your email, or enter the verification code
              below:
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <InputOTP
              maxLength={10}
              value={token}
              onChange={setToken}
              disabled={isVerifying}
              onPaste={(e) => {
                e.preventDefault()
                const pasted = e.clipboardData.getData("text")
                const sanitized = pasted.replace(/-/g, "").slice(0, 10)
                setToken(sanitized)
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={5} />
                <InputOTPSlot index={6} />
                <InputOTPSlot index={7} />
                <InputOTPSlot index={8} />
                <InputOTPSlot index={9} />
              </InputOTPGroup>
            </InputOTP>

            <Button
              className="w-full"
              onClick={() => handleVerify()}
              disabled={isVerifying || token.length !== 10}
            >
              {isVerifying ? "Verifying..." : "Verify Code"}
            </Button>
          </div>

          {sentEmail && (
            <Button className="w-full" variant="outline" onClick={handleResend}>
              <MailIcon className="mr-2 h-4 w-4" />
              Resend Magic Link
            </Button>
          )}

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
      title="Sign in with Magic Link"
      description="We'll send you a link to sign in instantly."
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
          {isSubmitting ? "Sending..." : "Send Magic Link"}
        </Button>
      </form>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          We&apos;ll send you an email with a link to sign in. No password
          needed!
        </p>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Prefer using a password?{" "}
        <Link
          href={`/auth/sign-in${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign in with password
        </Link>
      </p>
    </AuthLayout>
  )
}
