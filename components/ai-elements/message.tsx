import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { UIMessage } from 'ai'
import type { ComponentProps, HTMLAttributes } from 'react'

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role']
  timestamp?: string
  showActions?: boolean
}

export const Message = ({ className, from, timestamp, showActions = true, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full items-end gap-3 py-3 animate-fade-in relative',
      from === 'user' ? 'is-user justify-end' : 'is-assistant flex-row-reverse justify-end',
      from === 'user' ? '[&>div]:max-w-[80%]' : '[&>div]:max-w-full',
      className,
    )}
    {...props}
  />
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement> & {
  timestamp?: string
  from?: UIMessage['role']
}

export const MessageContent = ({
  children,
  className,
  timestamp,
  from,
  ...props
}: MessageContentProps) => (
  <div className="flex flex-col gap-1 w-full">
    <div
      className={cn(
        'flex flex-col gap-2 overflow-hidden rounded-2xl px-5 py-3.5 text-sm message-bubble relative',
        'transition-all duration-200 ease-out',
        // User message - bolt.new style gradient bubble
        'group-[.is-user]:bg-gradient-to-br group-[.is-user]:from-indigo-600 group-[.is-user]:to-purple-600',
        'group-[.is-user]:text-white group-[.is-user]:shadow-lg',
        'group-[.is-user]:border group-[.is-user]:border-white/20',
        // Assistant message - glassmorphism effect
        'group-[.is-assistant]:glass-effect group-[.is-assistant]:text-gray-900 dark:group-[.is-assistant]:text-gray-100',
        'group-[.is-assistant]:shadow-xl',
        className,
      )}
      {...props}
    >
      <div className="prose dark:prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
      {/* Timestamp on hover */}
      {timestamp && (
        <div
          className={cn(
            'absolute text-xs text-gray-400 dark:text-gray-500 px-2 py-1 rounded-md glass-effect',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'pointer-events-none',
            from === 'user' ? 'bottom-full right-0 mb-1' : 'bottom-full left-0 mb-1',
          )}
        >
          {timestamp}
        </div>
      )}
    </div>
  </div>
)

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string
  name?: string
}

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar
    className={cn('size-8 ring ring-1 ring-border', className)}
    {...props}
  >
    <AvatarImage alt="" className="mt-0 mb-0" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || 'ME'}</AvatarFallback>
  </Avatar>
)
