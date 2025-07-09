'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { fetchWithAutoRefresh } from '@/lib/fetchWithAutoRefresh'
import { endpoints } from '@/lib/endpoints'

const INACTIVITY_TIMEOUT = 60 * 60 * 1000 // 1 hour

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' })
  }

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }
    inactivityTimer.current = setTimeout(handleSignOut, INACTIVITY_TIMEOUT)
  }

  useEffect(() => {
    const verifySession = async () => {
      if (status === 'authenticated') {
        try {
          await fetchWithAutoRefresh(endpoints.USER.PROFILE, session)
          resetInactivityTimer()
          window.addEventListener('mousemove', resetInactivityTimer)
          window.addEventListener('keydown', resetInactivityTimer)
          window.addEventListener('click', resetInactivityTimer)
        } catch (error) {
          handleSignOut()
        }
      }
    }

    verifySession()

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
      window.removeEventListener('mousemove', resetInactivityTimer)
      window.removeEventListener('keydown', resetInactivityTimer)
      window.removeEventListener('click', resetInactivityTimer)
    }
  }, [status, session])

  return <>{children}</>
}