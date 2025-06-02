'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

const labelClass = 'text-gray-700 dark:text-gray-300';
const checkboxLabelClass = 'text-sm text-[#7A869A]';
const linkClass = 'text-cyan-600 underline hover:underline';

const Signup = () => {
  const router = useRouter();
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    toast({
      title: 'Account Created',
      description: 'Welcome to Tradex AI!',
    });

    router.replace('/dashboard');
  };

  const handleGoogleLogin = () => {
    toast({
      title: 'Google Login',
      description: 'Google OAuth would go here',
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f6f8fb] p-4 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl">
        <div className="rounded-t-[20px] border border-[#0088CC1C] bg-[#0088CC1C] py-2 px-3 text-left dark:border-[#0088CC1C] dark:bg-cyan-900/20">
          <p className="flex items-center gap-2 text-base font-medium text-cyan-600 dark:text-cyan-300">
            <span className="flex h-6 w-8 items-center justify-center rounded-full pl-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 9v3.75m0 3.75h.008v.008H11.25v-.008zm-.75-12a9 9 0 11-9 9 9 9 0 019-9z"
                />
              </svg>
            </span>
            Sign Up with Tradex AI
          </p>
        </div>

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
              Join Tradex AI today
            </CardTitle>
          </CardHeader>

          <CardContent className="px-10 sm:px-14">
            <Button
              variant="outline"
              className="mb-6 flex h-12 w-full items-center justify-center bg-teal-900 text-sm text-white"
              onClick={handleGoogleLogin}
              type="button"
            >
              <svg className="mr-1 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <div className="my-6 flex items-center">
              <hr className="flex-grow border-t border-gray-300" />
              <span className="mx-4 text-sm text-gray-500">OR</span>
              <hr className="flex-grow border-t border-gray-300" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-6">
                <div className="w-1/2">
                  <Label htmlFor="first-name" className={labelClass}>
                    First Name
                  </Label>
                  <Input id="first-name" name="firstName" type="text" required className="h-12" />
                </div>
                <div className="w-1/2">
                  <Label htmlFor="last-name" className={labelClass}>
                    Last Name
                  </Label>
                  <Input id="last-name" name="lastName" type="text" required className="h-12" />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className={labelClass}>
                  Email address
                </Label>
                <Input id="email" name="email" type="email" required className="h-12" />
              </div>

              <div>
                <Label htmlFor="password" className={labelClass}>
                  Password
                </Label>
                <Input id="password" name="password" type="password" required className="h-12" />
              </div>

              <div>
                <Label htmlFor="confirm-password" className={labelClass}>
                  Confirm Password
                </Label>
                <Input id="confirm-password" name="confirmPassword" type="password" required className="h-12" />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agree"
                    required
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(!!checked)}
                  />
                  <Label htmlFor="agree" className={checkboxLabelClass}>
                    I agree to the{' '}
                    <a href="#" className={linkClass}>Terms of Service</a>,{' '}
                    <a href="#" className={linkClass}>Privacy</a> and{' '}
                    <a href="#" className={linkClass}>Refund Policy</a>
                  </Label>
                </div>
              </div>

              <Button type="submit" className="h-12 w-full mb-9 bg-cyan-600 hover:bg-cyan-700">
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">Already have an account?</span>{' '}
              <Link href="/login" className="text-sm text-teal-500 hover:text-teal-300">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
