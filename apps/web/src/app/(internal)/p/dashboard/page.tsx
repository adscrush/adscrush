import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { EmpDashboardClient } from "@/features/portal/components/emp-dashboard-client"

export default async function EmpDashboardPage() {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/dashboard")

  return <EmpDashboardClient />
}
