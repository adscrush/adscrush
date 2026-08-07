"use client"

import { ContentShell } from "@/components/common/content-shell"
import { useMediaBuyer } from "@/features/media-buyers/queries"
import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import { Badge } from "@adscrush/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adscrush/ui/components/tabs"
import { getInitials } from "@adscrush/shared/lib/initials"
import {
  IconBan,
  IconCalendar,
  IconCircleCheckFilled,
  IconClock,
  IconMail,
  IconPhone,
} from "@tabler/icons-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface MediaBuyerDetailsClientProps {
  id: string
}

export function MediaBuyerDetailsClient({ id }: MediaBuyerDetailsClientProps) {
  const { data: buyer, isLoading, error } = useMediaBuyer(id)

  if (isLoading) {
    return (
      <ContentShell>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </ContentShell>
    )
  }

  if (error || !buyer) {
    notFound()
  }

  const statusIcon = {
    active: <IconCircleCheckFilled className="size-3.5 text-green-600 dark:text-green-400" />,
    pending: <IconClock className="size-3.5 text-yellow-500 dark:text-yellow-400" />,
    suspended: <IconBan className="size-3.5 text-gray-500 dark:text-gray-400" />,
  }[buyer.status]

  const statusLabel = buyer.status.charAt(0).toUpperCase() + buyer.status.slice(1)

  return (
    <ContentShell>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="text-lg">{getInitials(buyer.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{buyer.name}</h1>
            <Badge variant="outline" className="gap-1.5 px-2">
              {statusIcon}
              <span>{statusLabel}</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{buyer.email}</p>
        </div>
      </div>

      <Tabs defaultValue="info" className="mt-6">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="permissions" asChild>
            <Link href={`/media-buyers/${id}/permissions`}>Permissions</Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <IconMail className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{buyer.email}</p>
                  </div>
                </div>
                {buyer.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <IconPhone className="size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{buyer.phoneNumber}</p>
                    </div>
                  </div>
                )}
                {buyer.accountManager && (
                  <div className="flex items-center gap-3">
                    <Avatar className="size-6 shrink-0">
                      {buyer.accountManager.image ? (
                        <AvatarImage src={buyer.accountManager.image} alt={buyer.accountManager.name ?? ""} />
                      ) : null}
                      <AvatarFallback className="text-[10px]">
                        {getInitials(buyer.accountManager.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Manager</p>
                      <p className="text-sm">{buyer.accountManager.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <IconCalendar className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {new Date(buyer.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                {buyer.trafficSources && buyer.trafficSources.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {buyer.trafficSources.map((source) => (
                      <Badge key={source} variant="secondary">
                        {source}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No traffic sources specified</p>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            {buyer.paymentMethod && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Method</p>
                    <p className="text-sm">{buyer.paymentMethod}</p>
                  </div>
                  {buyer.paymentDetails && (
                    <div>
                      <p className="text-xs text-muted-foreground">Details</p>
                      <p className="text-sm">{buyer.paymentDetails}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Internal Notes */}
            {buyer.internalNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{buyer.internalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ContentShell>
  )
}
