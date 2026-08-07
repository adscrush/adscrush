import { Card, CardContent } from "@adscrush/ui/components/card"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
}

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-muted-foreground text-sm font-medium">{title}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
