'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatSelector } from './chat-selector'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const isHomepage = pathname === '/'

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHomepage) {
      e.preventDefault()
      // Add reset parameter to trigger UI reset
      window.location.href = '/?reset=true'
    }
    closeMenu()
  }

  const openMenu = () => {
    setIsOpen(true)
    // Use requestAnimationFrame to ensure the element is rendered before animating
    requestAnimationFrame(() => {
      setIsAnimating(true)
    })
  }

  const closeMenu = () => {
    setIsAnimating(false)
    setTimeout(() => setIsOpen(false), 300) // Match animation duration
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden h-8 w-8 p-0"
        onClick={openMenu}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ease-out ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMenu}
          />

          {/* Menu panel */}
          <div
            className={`fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-black border-l border-border shadow-lg transform transition-transform duration-300 ease-out ${
              isAnimating ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Close button in top-right corner */}
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={closeMenu}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>

              {/* Menu content */}
              <div className="flex-1 overflow-y-auto p-4 pt-16 space-y-4">
                {/* Chat selector for authenticated users */}
                {session?.user?.id && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Your Chats
                    </h3>
                    <div className="w-full">
                      <ChatSelector />
                    </div>
                  </div>
                )}

                {/* Menu items */}
                <div className="space-y-2">
                    {/* Removed: What's This?, GitHub, Deploy with Vercel (per user request) */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
