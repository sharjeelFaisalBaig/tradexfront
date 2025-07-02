'use client'

import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Loader from './common/Loader'
import { fetchWithAutoRefresh } from '@/lib/fetchWithAutoRefresh'
import { endpoints } from '@/lib/endpoints'

const INACTIVITY_TIMEOUT = 60 * 60 * 1000 // 1 hour

export default function withAuth(Component: any) {
  return function WithAuth(props: any) {
    const { data: session, status } = useSession()
    const [isVerifying, setIsVerifying] = useState(true)
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
        if (status === 'authenticated' && session?.accessToken) {
          try {
            // This endpoint should be a lightweight endpoint to verify the token
            await fetchWithAutoRefresh(endpoints.USER.PROFILE, session)
            setIsVerifying(false)
            resetInactivityTimer()
            window.addEventListener('mousemove', resetInactivityTimer)
            window.addEventListener('keydown', resetInactivityTimer)
            window.addEventListener('click', resetInactivityTimer)
          } catch (error) {
            handleSignOut()
          }
        } else if (status === 'unauthenticated') {
          redirect('/auth/signin')
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

    if (status === 'loading' || isVerifying) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
          <Loader text="Verifying session..." />
        </div>
      )
    }

    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }

    return <Component {...props} />
  }
}