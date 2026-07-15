'use client'

import { ArrowUturnLeftIcon } from '@heroicons/react/20/solid'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import type { Comment } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/shared/user-avatar'

export interface CommentThreadProps extends React.HTMLAttributes<HTMLDivElement> {
  comments: Comment[]
  showInternal?: boolean
  onReply?: (parentId: string, body: string) => void | Promise<void>
  isReplying?: boolean
}

interface CommentItemProps {
  comment: Comment
  depth?: number
  showInternal?: boolean
  onReply?: (parentId: string, body: string) => void | Promise<void>
  isReplying?: boolean
}

function CommentItem({
  comment,
  depth = 0,
  showInternal = false,
  onReply,
  isReplying = false,
}: CommentItemProps) {
  const [isComposing, setIsComposing] = useState(false)
  const [replyBody, setReplyBody] = useState('')

  const handleSubmitReply = async () => {
    if (!replyBody.trim() || !onReply) return
    await onReply(comment.id, replyBody.trim())
    setReplyBody('')
    setIsComposing(false)
  }

  return (
    <div className={twMerge('group/comment', depth > 0 && 'ms-8 border-s border-border ps-4')}>
      <div className="flex gap-3 py-3">
        <UserAvatar profile={comment.author} size="sm" className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-fg text-sm/6">
              {comment.author?.full_name ?? 'Unknown'}
            </span>
            {showInternal && comment.is_internal && (
              <Badge intent="warning" isCircle={false}>
                Internal
              </Badge>
            )}
            <time
              className="text-muted-fg text-xs/5 tabular-nums"
              dateTime={comment.created_at}
              title={new Date(comment.created_at).toLocaleString()}
            >
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </time>
          </div>
          <p className="whitespace-pre-wrap text-pretty text-sm/6 text-fg/90">{comment.body}</p>
          {onReply && (
            <Button
              intent="plain"
              size="xs"
              className="opacity-0 transition-opacity group-hover/comment:opacity-100"
              onPress={() => setIsComposing((value) => !value)}
            >
              <ArrowUturnLeftIcon />
              Reply
            </Button>
          )}
          {isComposing && (
            <div className="space-y-2 pt-1">
              <Textarea
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                placeholder="Write a reply…"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  intent="primary"
                  isPending={isReplying}
                  onPress={() => void handleSubmitReply()}
                  isDisabled={!replyBody.trim()}
                >
                  Post reply
                </Button>
                <Button size="sm" intent="plain" onPress={() => setIsComposing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          showInternal={showInternal}
          onReply={onReply}
          isReplying={isReplying}
        />
      ))}
    </div>
  )
}

export function CommentThread({
  comments,
  showInternal = false,
  onReply,
  isReplying = false,
  className,
  ...props
}: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <p className="py-8 text-center text-muted-fg text-sm/6" data-slot="comment-thread-empty">
        No comments yet
      </p>
    )
  }

  return (
    <div data-slot="comment-thread" className={twMerge('divide-y divide-border', className)} {...props}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          showInternal={showInternal}
          onReply={onReply}
          isReplying={isReplying}
        />
      ))}
    </div>
  )
}
