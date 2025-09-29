"use client"

import { createContext, useContext, ReactNode } from 'react'
import { useSession } from '@/hooks/use-session'

interface SessionContextType {
  isLoggedIn: boolean
  user: any
  isLoading: boolean
  logout: () => Promise<void>
  updateActivity: () => void
  refreshSession: () => Promise<boolean>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const session = useSession()

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider')
  }
  return context
}
