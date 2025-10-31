'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChatSelector } from './chat-selector'
import { MobileMenu } from './mobile-menu'
import { useSession } from 'next-auth/react'
import { UserNav } from '@/components/user-nav'
import { Button } from '@/components/ui/button'
import { AJStudiozLogo } from '@/components/ui/icons'
import { useProvider } from '@/contexts/provider-context'

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

          {/* Desktop right side - Provider toggles and User */}
          <div className="hidden lg:flex items-center gap-3">
            {/* API Provider Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shadow-sm">
              <Button
                variant={provider === 'v0' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setProvider('v0')}
                className={`h-8 px-3 text-xs font-medium transition-all ${
                  provider === 'v0' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                v0
              </Button>
              <Button
                variant={provider === 'claude' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setProvider('claude')}
                className={`h-8 px-3 text-xs font-medium transition-all ${
                  provider === 'claude' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Claude
              </Button>
              <Button
                variant={provider === 'grok' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setProvider('grok')}
                className={`h-8 px-3 text-xs font-medium transition-all ${
                  provider === 'grok' 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Grok
              </Button>
            </div>

            {/* Streaming Toggle (only for v0 provider) */}
            {provider === 'v0' && (
              <Button
                variant={streaming ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStreaming(!streaming)}
                className={`h-8 px-3 text-xs font-medium transition-all ${
                  streaming
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {streaming ? '⚡ Streaming' : 'Streaming Off'}
              </Button>
            )}

            <UserNav session={session} />
          </div>

          {/* Mobile right side - Only menu button and user avatar */}
          <div className="flex lg:hidden items-center gap-2">
            <UserNav session={session} />
            <MobileMenu />
          </div>
        </div>
      </div>
    </div>
  )
}
