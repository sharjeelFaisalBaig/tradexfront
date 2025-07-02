'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Loader from './common/Loader'

export default function withAuth(Component: any) {
  return function WithAuth(props: any) {
    const { data: session, status } = useSession()

    if (status === 'loading') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
          <Loader text="Loading..." />
        </div>
      )
    }

    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }

    return <Component {...props} />
  }
}