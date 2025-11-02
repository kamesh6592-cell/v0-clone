'use client'

import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1.5 px-4 py-3', className)}>
      <div className="flex gap-1">
        <span
          className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1s' }}
        />
        <span
          className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '1s' }}
        />
        <span
          className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '1s' }}
        />
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">AI is thinking...</span>
    </div>
  )
}
