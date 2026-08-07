import { auth } from "@/lib/auth/server"
import { headers } from "next/headers"
import { SignOutButton } from "./sign-out-button"
import {
  IconShieldExclamation,
  IconLock,
} from "@tabler/icons-react"
import Link from "next/link"

export default async function AccessDeniedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        {/* Icon */}
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <IconShieldExclamation className="size-8 text-destructive" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold tracking-tight">
          Access Denied
        </h1>

        {/* Description */}
        <p className="text-balance text-muted-foreground">
          You don&apos;t have permission to access this application.
          {session?.user?.email && (
            <>
              {" "}If you believe this is a mistake, please contact your account
              manager for <strong>{session.user.email}</strong>.
            </>
          )}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <IconLock className="size-4" />
            Sign in as a different user
          </Link>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
