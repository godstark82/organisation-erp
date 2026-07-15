import { twMerge } from 'tailwind-merge'
import type { Profile } from '@/types'
import { Avatar, type AvatarProps } from '@/components/ui/avatar'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2)
  return `${parts[0][0]}${parts[parts.length - 1][0]}`
}

export interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'initials' | 'alt'> {
  profile?: Pick<Profile, 'full_name' | 'avatar_url'> | null
  name?: string
  src?: string | null
}

export function UserAvatar({ profile, name, src, className, ...props }: UserAvatarProps) {
  const displayName = name ?? profile?.full_name ?? 'User'
  const avatarSrc = src ?? profile?.avatar_url ?? null
  const initials = getInitials(displayName)

  return (
    <Avatar
      src={avatarSrc}
      initials={avatarSrc ? undefined : initials}
      alt={displayName}
      className={twMerge('bg-secondary text-muted-fg', className)}
      {...props}
    />
  )
}
