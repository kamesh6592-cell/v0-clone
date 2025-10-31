'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChatSelector } from './chat-selector'
import { MobileMenu } from './mobile-menu'
import { useSession } from 'next-auth/react'
import { UserNav } from '@/components/user-nav'
import { Button } from '@/components/ui/button'
import { VercelIcon, GitHubIcon, AJStudiozLogo } from '@/components/ui/icons'
import { DEPLOY_URL } from '@/lib/constants'
import { Info } from 'lucide-react'
import { useProvider } from '@/contexts/provider-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AppHeaderProps {
  className?: string
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SearchParamsHandler() {
  const searchParams = useSearchParams()
  const { update } = useSession()

  // Force session refresh when redirected after auth
  useEffect(() => {
    const shouldRefresh = searchParams.get('refresh') === 'session'

    if (shouldRefresh) {
      // Force session update
      update()

      // Clean up URL without causing navigation
      const url = new URL(window.location.href)
      url.searchParams.delete('refresh')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [searchParams, update])

  return null
}

export function AppHeader({ className = '' }: AppHeaderProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { provider, setProvider, streaming, setStreaming } = useProvider()
  const isHomepage = pathname === '/'
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)

  // Handle logo click - reset UI if on homepage, otherwise navigate to homepage
  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHomepage) {
      e.preventDefault()
      // Add reset parameter to trigger UI reset
      window.location.href = '/?reset=true'
    }
    // If not on homepage, let the Link component handle navigation normally
  }

  return (
    <div
      className={`${!isHomepage ? 'border-b border-border dark:border-input' : ''} ${className}`}
    >
      {/* Handle search params with Suspense boundary */}
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Selector */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
            >
              <AJStudiozLogo size={32} />
              <span>AJ STUDIOZ</span>
            </Link>
            {/* Hide ChatSelector on mobile */}
            <div className="hidden lg:block">
              <ChatSelector />
            </div>
          </div>

          {/* Desktop right side - Provider toggles, What's This, GitHub, Deploy, and User */}
          <div className="hidden lg:flex items-center gap-4">
            {/* API Provider Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={provider === 'v0' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setProvider('v0')}
                className="h-7 px-2 text-xs"
              >
                v0
              </Button>
              <Button
                variant={provider === 'claude' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setProvider('claude')}
                className="h-7 px-2 text-xs"
              >
                Claude
              </Button>
            </div>

            {/* Streaming Toggle (only for v0 provider) */}
            {provider === 'v0' && (
              <Button
                variant={streaming ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStreaming(!streaming)}
                className="h-7 px-2 text-xs"
              >
                {streaming ? 'Streaming On' : 'Streaming Off'}
              </Button>
            )}

            <Button
              variant="outline"
              className="py-1.5 px-2 h-fit text-sm"
              onClick={() => setIsInfoDialogOpen(true)}
            >
              <Info size={16} />
              What's This?
            </Button>
            <Button
              variant="outline"
              className="py-1.5 px-2 h-fit text-sm"
              asChild
            >
              <Link
                href="https://github.com/vercel/v0-sdk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon size={16} />
                vercel/v0-sdk
              </Link>
            </Button>

            {/* Deploy with Vercel button - hidden on mobile */}
            <Button
              className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 py-1.5 px-2 h-fit text-sm"
              asChild
            >
              <Link href={DEPLOY_URL} target="_blank" rel="noopener noreferrer">
                <VercelIcon size={16} />
                Deploy with Vercel
              </Link>
            </Button>
            <UserNav session={session} />
          </div>

          {/* Mobile right side - Only menu button and user avatar */}
          <div className="flex lg:hidden items-center gap-2">
            <UserNav session={session} />
            <MobileMenu onInfoDialogOpen={() => setIsInfoDialogOpen(true)} />
          </div>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-4">
              AJ STUDIOZ Platform
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              This is <strong>AJ STUDIOZ</strong> - an AI-powered platform where users can enter text prompts and generate React components
              and applications using AI, built with both{' '}
              <a
                href="https://v0.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                v0 SDK
              </a>{' '}
              and{' '}
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Claude API
              </a>.
            </p>
            <p>
              It's built with{' '}
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Next.js
              </a>{' '}
              and integrates both{' '}
              <a
                href="https://v0-sdk.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                v0 SDK
              </a>{' '}
              and Claude API to provide a full-featured interface with authentication, database
              integration, and real-time streaming responses.
            </p>
            <p>
              Try the platform or{' '}
              <a
                href={DEPLOY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                deploy your own
              </a>
              .
            </p>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              onClick={() => setIsInfoDialogOpen(false)}
              className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900"
            >
              Try now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
