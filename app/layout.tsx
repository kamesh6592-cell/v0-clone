import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { StreamingProvider } from '@/contexts/streaming-context'
import { ProviderProvider } from '@/contexts/provider-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { SWRProvider } from '@/components/providers/swr-provider'
import { SessionProvider } from '@/components/providers/session-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AJ STUDIOZ',
  description:
    'Generate and preview React components with AI - Built with v0 SDK and Claude API',
  icons: {
    icon: '/aj-logo.jpg',
    shortcut: '/aj-logo.jpg',
    apple: '/aj-logo.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force dark mode by default (bolt.new style)
              document.documentElement.classList.add('dark');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider>
          <SessionProvider>
            <SWRProvider>
              <ProviderProvider>
                <StreamingProvider>{children}</StreamingProvider>
              </ProviderProvider>
            </SWRProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
