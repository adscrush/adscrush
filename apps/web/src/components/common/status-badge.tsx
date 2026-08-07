import { Badge } from "@adscrush/ui/components/badge"

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  approved: "default",
  inactive: "secondary",
  pending: "outline",
  suspended: "destructive",
  rejected: "destructive",
  paused: "secondary",
  expired: "destructive",
  hold: "outline",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariants[status] ?? "secondary"}>
      {status}
    </Badge>
  )
}
