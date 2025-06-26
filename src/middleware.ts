import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
  const isPublicRoute = ['/auth/signin', '/auth/error', '/'].includes(nextUrl.pathname)
  const isAuthRoute = nextUrl.pathname.startsWith('/auth/')

  // // Allow API auth routes
  // if (isApiAuthRoute) {
  //   return NextResponse.next()
  // }

  // // Redirect logged in users away from auth pages
  // if (isAuthRoute) {
  //   if (isLoggedIn) {
  //     // return NextResponse.redirect(new URL('/dashboard', nextUrl))
  //   }
  //   return NextResponse.next()
  // }

  // // Protect private routes
  // if (!isLoggedIn && !isPublicRoute) {
  //   return NextResponse.redirect(new URL('/auth/signin', nextUrl))
  // }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}