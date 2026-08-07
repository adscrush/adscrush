import { SignUpForm } from "@/features/auth/components/sign-up-form"
import { auth } from "@/lib/auth/server"
import { type SearchParams } from "@/types"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"

interface PageProps {
  searchParams: Promise<SearchParams>
}

async function SessionChecker({ searchParams }: PageProps) {
  const headersRaw = await headers()
  const session = await auth.api.getSession({
    headers: headersRaw,
  })
  const search = await searchParams
  if (session) redirect(search.callbackUrl ?? "/dashboard")
  return <SignUpForm />
}

export default function Page({ searchParams }: PageProps) {
  return (
    <Suspense fallback={null}>
      <SessionChecker searchParams={searchParams} />
    </Suspense>
  )
}
