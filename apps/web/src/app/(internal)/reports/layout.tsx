import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Reports | Adscrush",
  description: "View detailed performance reports and analytics.",
}

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return children
}
