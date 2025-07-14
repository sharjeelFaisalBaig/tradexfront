"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSignup } from "@/services/auth/auth_Mutation";
import { getCsrfToken } from "@/services/auth/csrf";
import Loader from "@/components/common/Loader";

import { z } from "zod";

const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the terms" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type SignupSchema = z.infer<typeof signupSchema>;

const labelClass = "text-gray-700 dark:text-gray-300 block mb-1";
const checkboxLabelClass = "text-sm text-[#7A869A]";
const linkClass = "text-cyan-600 underline hover:underline";

const Signup = () => {
  const router = useRouter();
  const { mutate, isPending } = useSignup();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupSchema) => {
    const { confirmPassword, ...formData } = values;

    await getCsrfToken();

    // @ts-ignore
    mutate(formData, {
      onSuccess: (data) => {
        if (data && data.data) {
          const { user, otp_expires_in } = data.data;
          router.replace(
            `/auth/otp?email=${user.email}&expires_in=${otp_expires_in}`
          );
          toast({
            title: "Account Created",
            description: "Please check your email for the OTP.",
          });
        }
      },
      onError: (error: any) => {
        const message =
          error?.errors && Object.values(error.errors).flat().join(", ");
        toast({
          title: error?.message || "Error",
          description:
            message ||
            "There was an issue creating your account. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const handleGoogleLogin = () => {
    // Implement Google OAuth logic here
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f6f8fb] p-4 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl">
        <div className="rounded-t-[20px] border border-[#0088CC1C] bg-[#0088CC1C] py-2 px-3 text-left dark:border-[#0088CC1C] dark:bg-cyan-900/20">
          <p className="flex items-center gap-2 text-base font-medium text-cyan-600 dark:text-cyan-300">
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
              <svg
                className="mr-1 h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex gap-6">
                <div className="w-1/2">
                  <Label htmlFor="first-name" className={labelClass}>
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    {...register("firstName")}
                    className="h-12"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="w-1/2">
                  <Label htmlFor="last-name" className={labelClass}>
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    {...register("lastName")}
                    className="h-12"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className={labelClass}>
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="h-12"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className={labelClass}>
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="h-12"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirm-password" className={labelClass}>
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  {...register("confirmPassword")}
                  className="h-12"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agree"
                    checked={watch("agreeTerms")}
                    onCheckedChange={(checked) =>
                      // @ts-ignore
                      setValue("agreeTerms", !!checked)
                    }
                  />
                  <Label htmlFor="agree" className={checkboxLabelClass}>
                    I agree to the{" "}
                    <a href="#" className={linkClass}>
                      Terms of Service
                    </a>
                    ,{" "}
                    <a href="#" className={linkClass}>
                      Privacy
                    </a>{" "}
                    and{" "}
                    <a href="#" className={linkClass}>
                      Refund Policy
                    </a>
                  </Label>
                </div>
                {errors.agreeTerms && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.agreeTerms.message}
                  </p>
                )}
              </div>

              <Button
                disabled={isPending}
                type="submit"
                className="h-12 w-full mb-9 bg-cyan-600 hover:bg-cyan-700"
              >
                {isPending ? <Loader text="Creating..." /> : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">
                Already have an account?
              </span>{" "}
              <Link
                href="/auth/signin"
                className="text-sm text-teal-500 hover:text-teal-300"
              >
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
