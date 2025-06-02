'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from '@/hooks/use-toast'

import ExclamationIcon from '../../icons/exclamation.svg'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Login Successful',
      description: 'Welcome to Tradex AI!',
    })
    router.replace('/dashboard')
  }

  const handleGoogleLogin = () => {
    toast({
      title: 'Google Login',
      description: 'Google OAuth integration would go here',
    })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f6f8fb] p-4 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        {/* Top Label Bar */}
        <div className="rounded-t-[20px] border border-[#0088CC1C] bg-[#0088CC1C] py-2 px-3 text-left dark:border-[#0088CC1C] dark:bg-cyan-900/20">
          <p className="flex items-center gap-2 text-base font-medium text-cyan-600 dark:text-cyan-300">
            <span className="flex h-6 w-8 items-center justify-center rounded-full pl-2">
              <ExclamationIcon width={24} height={24} />
            </span>
            Login with Tradex AI
          </p>
        </div>

        {/* Login Card */}
        <Card className="rounded-b-[20px] rounded-t-none border-0 shadow-lg">
          <CardHeader className="flex flex-col items-center gap-2 pb-4 pt-8 text-center">
            <Image
              src="/logo.png"
              alt="Tradex AI Logo"
              width={148}
              height={32}
              className="mt-2 object-contain"
              priority
            />
            <CardTitle className="text-base font-normal text-gray-700 dark:text-gray-300">
              Please sign in to continue
            </CardTitle>
          </CardHeader>

          <CardContent className="px-8 sm:px-12">
            {/* Google Button */}
            <Button
              variant="outline"
              className="mb-6 flex h-12 w-full items-center justify-center bg-teal-900 text-sm text-white"
              onClick={handleGoogleLogin}
            >
              <svg className="mr-1 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <hr className="flex-grow border-t border-gray-300" />
              <span className="mx-4 text-sm text-gray-500">OR</span>
              <hr className="flex-grow border-t border-gray-300" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-300">
                  Email address <span className="text-cyan-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-gray-700 dark:text-gray-300">
                  Password <span className="text-cyan-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <Label htmlFor="remember" className="text-sm text-[#7A869A]">
                    Remember me
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-teal-500 hover:text-teal-300">
                  Forgot Password
                </Link>
              </div>

              <Button type="submit" className="h-12 w-full mb-9 bg-cyan-600 hover:bg-cyan-700">
                Sign In
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">Don&apos;t have an account?</span>{' '}
              <Link href="/register" className="text-sm text-teal-500 hover:text-teal-300">
                Sign up now
              </Link>
            </div>

            <div className="mb-8 mt-6 text-center text-xs leading-relaxed text-gray-500">
              By continuing, you agree to our<br />
              <a href="#" className="text-cyan-600 hover:underline">Terms of Service</a>,{' '}
              <a href="#" className="text-cyan-600 hover:underline">Privacy</a>, and{' '}
              <a href="#" className="text-cyan-600 hover:underline">Refund Policy</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
