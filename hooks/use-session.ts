"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  role: string
}

interface SessionData {
  user: User
  token: string
  lastActivity: number
}

const INACTIVITY_TIMEOUT = 3 * 60 * 1000 // 3 minutes in milliseconds
const SESSION_CHECK_INTERVAL = 30 * 1000 // Check every 30 seconds

export function useSession() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout API to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state
      setIsLoggedIn(false)
      setUser(null)
      setLastActivity(Date.now())
      
      // Clear any stored session data
      localStorage.removeItem('sessionData')
      
      // Redirect to login
      router.push('/login')
    }
  }, [router])

  // Check if session is still valid
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setIsLoggedIn(true)
        setUser(data.user)
        setLastActivity(Date.now())
        return true
      } else {
        await logout()
        return false
      }
    } catch (error) {
      console.error('Session check error:', error)
      await logout()
      return false
    }
  }, [logout])

  // Check for inactivity
  const checkInactivity = useCallback(() => {
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivity
    
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      console.log('Session expired due to inactivity')
      logout()
    }
  }, [lastActivity, logout])

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true)
      await checkSession()
      setIsLoading(false)
    }
    
    initSession()
  }, []) // Remove checkSession dependency to avoid infinite loop

  // Set up activity listeners
  useEffect(() => {
    if (!isLoggedIn) return

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    const handleActivity = () => {
      updateActivity()
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [isLoggedIn, updateActivity])

  // Set up inactivity checker
  useEffect(() => {
    if (!isLoggedIn) return

    const interval = setInterval(checkInactivity, SESSION_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [isLoggedIn, checkInactivity])

  // Handle page visibility change (tab switching)
  useEffect(() => {
    if (!isLoggedIn) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, update activity to prevent immediate logout
        updateActivity()
      } else {
        // Page is visible again, check session
        checkSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isLoggedIn, updateActivity, checkSession])

  // Handle beforeunload (page refresh/close)
  useEffect(() => {
    if (!isLoggedIn) return

    const handleBeforeUnload = () => {
      // Clear session on page close/refresh
      logout()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isLoggedIn, logout])

  return {
    isLoggedIn,
    user,
    isLoading,
    logout,
    updateActivity,
    refreshSession: checkSession
  }
}
