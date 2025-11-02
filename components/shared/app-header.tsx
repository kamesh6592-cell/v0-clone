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
      className={`${!isHomepage ? 'border-b glass-effect' : 'glass-effect'} ${className} sticky top-0 z-50 backdrop-blur-xl`}
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
            {/* API Provider Toggle - Bolt.new style */}
            <div className="flex items-center gap-1.5 glass-effect rounded-xl p-1.5 shadow-lg">
              <Button
                variant={provider === 'v0' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setProvider('v0')}
                className={`h-9 px-4 text-xs font-semibold transition-all duration-200 rounded-lg ${
                  provider === 'v0' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md' 
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                v0
              </Button>
              <Button
                variant={provider === 'claude' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setProvider('claude')}
                className={`h-9 px-4 text-xs font-semibold transition-all duration-200 rounded-lg ${
                  provider === 'claude' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md' 
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                Claude
              </Button>
              <Button
                variant={provider === 'grok' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setProvider('grok')}
                className={`h-9 px-4 text-xs font-semibold transition-all duration-200 rounded-lg ${
                  provider === 'grok' 
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md' 
                    : 'hover:bg-white/5 text-gray-300'
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
                className={`h-9 px-4 text-xs font-semibold transition-all duration-200 rounded-lg ${
                  streaming
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md pulse-glow'
                    : 'glass-effect hover:bg-white/5 text-gray-300 border-white/10'
                }`}
              >
                {streaming ? '⚡ Streaming' : '○ Streaming'}
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
