'use client'

import { useState } from 'react'
import { Copy, Check, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  content: string
  onRegenerate?: () => void
  className?: string
}

export function MessageActions({ content, onRegenerate, className }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div
      className={cn(
        'absolute -top-10 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100',
        'transition-all duration-200 pointer-events-none group-hover:pointer-events-auto',
        'glass-effect rounded-lg p-1 shadow-lg border border-white/10',
        className
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 w-7 p-0 hover:bg-white/10 transition-colors"
        title="Copy message"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        )}
      </Button>
      {onRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="h-7 w-7 p-0 hover:bg-white/10 transition-colors"
          title="Regenerate response"
        >
          <RotateCw className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        </Button>
      )}
    </div>
  )
}
