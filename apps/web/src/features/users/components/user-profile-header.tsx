"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import { getInitials } from "@adscrush/shared/lib/initials"
import { IconBan, IconChevronLeft, IconUserSearch } from "@tabler/icons-react"
import Link from "next/link"
import type { UserDetail } from "../queries"

interface UserProfileHeaderProps {
  user: UserDetail
  onBan: () => void
  onUnban: () => void
  onImpersonate: () => void
}

export function UserProfileHeader({
  user,
  onBan,
  onUnban,
  onImpersonate,
}: UserProfileHeaderProps) {
  const isBanned = Boolean(user.banned)
  const initials = getInitials(user.name ?? "")

  return (
    <div className="space-y-5">
      {/* Breadcrumb row */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/users"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <IconChevronLeft className="size-4" />
          Users
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{user.name}</span>
      </div>

      {/* Profile card row */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar className="size-16">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
          <AvatarFallback className="text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* User info */}
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold leading-tight">{user.name}</h1>
            {isBanned && (
              <Badge variant="destructive">Banned</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {user.role?.replace(/_/g, " ")}
            </Badge>
            {user.emailVerified ? (
              <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600/30">
                Email Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Email Not Verified
              </Badge>
            )}
            {user.hasEmployeeProfile && (
              <Badge variant="outline">Employee</Badge>
            )}
            {user.hasAdvertiserProfile && (
              <Badge variant="outline">Advertiser</Badge>
            )}
            {user.hasMediaBuyerProfile && (
              <Badge variant="outline">Media Buyer</Badge>
            )}
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onImpersonate}>
            <IconUserSearch className="size-4 mr-1.5" />
            Impersonate
          </Button>

          <Button
            variant={isBanned ? "outline" : "destructive"}
            size="sm"
            onClick={isBanned ? onUnban : onBan}
          >
            <IconBan className="size-4 mr-1.5" />
            {isBanned ? "Unban" : "Ban"}
          </Button>
        </div>
      </div>
    </div>
  )
}
