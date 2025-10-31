'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type APIProvider = 'v0' | 'claude' | 'grok'

interface ProviderContextType {
  provider: APIProvider
  setProvider: (provider: APIProvider) => void
  streaming: boolean
  setStreaming: (streaming: boolean) => void
}

const ProviderContext = createContext<ProviderContextType | null>(null)

export function useProvider() {
  const context = useContext(ProviderContext)
  if (!context) {
    throw new Error('useProvider must be used within a ProviderProvider')
  }
  return context
}

interface ProviderProviderProps {
  children: ReactNode
}

export function ProviderProvider({ children }: ProviderProviderProps) {
  const [provider, setProvider] = useState<APIProvider>('v0')
  const [streaming, setStreaming] = useState(true)

  return (
    <ProviderContext.Provider
      value={{
        provider,
        setProvider,
        streaming,
        setStreaming,
      }}
    >
      {children}
    </ProviderContext.Provider>
  )
}