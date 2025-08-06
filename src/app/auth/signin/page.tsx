"use client";

// Core hooks and libraries
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Formik and Yup for form handling and validation
import { useFormik } from "formik";
import * as Yup from "yup";

// UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
import { signIn } from "next-auth/react";
import Loader from "@/components/common/Loader";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

export default function LoginPage() {
  const router = useRouter();
  const successNote = useSuccessNotifier();

  // Initialize Formik with initial values, validation schema, and submit handler
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);

      try {
        // Attempt login using NextAuth credentials provider
        const res = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        console.log({ res });

        // Handle different possible login responses
        if (res?.error) {
          // Set redirect flag in localStorage
          sessionStorage.setItem("otpRedirected", "true");

          if (res.error === "CredentialsSignin") {
            // Email exists, but password incorrect – prompt for OTP
            router.replace(
              `/auth/otp?email=${encodeURIComponent(values.email)}&2fa=false`
            );
            successNote({
              title: "Verification Required",
              description: "Please verify your email with the OTP.",
            });
          } else if (res.error.startsWith("2faEnabled:")) {
            // 2FA is enabled – redirect with correct email
            const emailFromError = res.error.split(":")[1];
            router.replace(
              `/auth/otp?email=${encodeURIComponent(emailFromError)}&2fa=true`
            );
            successNote({
              title: "2FA Required",
              description: "Please enter the OTP from your authenticator app.",
            });
          } else if (res.error === "Verification") {
            // General verification error – fallback for unknown OTP flow
            router.replace(
              `/auth/otp?email=${encodeURIComponent(values.email)}&2fa=true`
            );
            successNote({
              title: "2FA Required",
              description: "Please verify your email with the OTP.",
            });
          }
          //  else if (res.error === "Configuration") {
          //   // General "Configuration" error – unverified user - redirect to forget password for email verification
          //   router.replace(`/auth/forgot-password`);
          //   successNote({
          //     title: "2FA Required",
          //     description: "Please verify your email with the OTP.",
          //   });
          // }
          else {
            // Set redirect flag in localStorage
            sessionStorage.removeItem("otpRedirected");

            // Invalid credentials
            toast({
              title: "Login Failed",
              description: "Please check your credentials and try again.",
              variant: "destructive",
            });
          }
        } else {
          // Successful login – redirect to dashboard
          router.replace("/dashboard");
          successNote({
            title: "Login Successful",
            description: "Navigating to dashboard.",
          });
        }
      } catch (error) {
        // Fallback error handling
        toast({
          title: "Login Failed",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      }

      setSubmitting(false);
    },
  });

  // Google OAuth sign-in handler
  const handleGoogleSignIn = async () => {
    // signIn("google");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f6f8fb] p-4 dark:bg-gray-900">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        {/* Header label with border */}
        <div className="rounded-t-[20px] border border-[#0088CC1C] bg-[#0088CC1C] py-2 px-3 text-left dark:border-[#0088CC1C] dark:bg-cyan-900/20">
          <p className="flex items-center gap-2 text-base font-medium text-cyan-600 dark:text-cyan-300">
            Login with Tradex AI
          </p>
        </div>

        {/* Login card UI */}
        <Card className="rounded-b-[20px] rounded-t-none border-0 shadow-lg">
          <CardHeader className="flex flex-col items-center gap-2 pb-4 pt-8 text-center">
            {/* Logo */}
            <Image
              src="/tradex-logo.svg"
              alt="Tradex AI Logo"
              width={148}
              height={32}
              className="mt-2 object-contain dark:hidden"
              priority
            />
            <Image
              src="/tradex-logo-dark.svg"
              alt="Tradex AI Logo"
              width={148}
              height={32}
              className="mt-2 object-contain hidden dark:block"
              priority
            />
            <CardTitle className="text-base font-normal text-gray-700 dark:text-gray-300">
              Please sign in to continue
            </CardTitle>
          </CardHeader>

          <CardContent className="px-8 sm:px-12">
            {/* Google Login Button */}
            <Button
              variant="outline"
              className="mb-6 flex h-12 w-full items-center justify-center bg-teal-900 text-sm text-white"
              onClick={handleGoogleSignIn}
            >
              {/* Google Icon */}
              <svg
                className="mr-1 h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
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
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="h-12"
                  {...formik.getFieldProps("email")}
                />
                {/* Email Validation Error */}
                {formik.touched.email && formik.errors.email && (
                  <div className="text-sm text-red-500">
                    {formik.errors.email}
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="h-12"
                  {...formik.getFieldProps("password")}
                />
                {/* Password Validation Error */}
                {formik.touched.password && formik.errors.password && (
                  <div className="text-sm text-red-500">
                    {formik.errors.password}
                  </div>
                )}
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formik.values.rememberMe}
                    onCheckedChange={(checked) =>
                      formik.setFieldValue("rememberMe", !!checked)
                    }
                  />
                  <Label htmlFor="remember" className="text-sm text-[#7A869A]">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-teal-500 hover:text-teal-300"
                >
                  Forgot Password
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full py-3 h-12 rounded-full bg-cyan-600 text-white text-lg font-semibold transition-colors hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {formik.isSubmitting ? (
                  <Loader direction="row" text="Signing In..." />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Signup Link */}
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">
                Don&apos;t have an account?
              </span>{" "}
              <Link
                href="/auth/signup"
                className="text-sm text-teal-500 hover:text-teal-300"
              >
                Sign up now
              </Link>
            </div>

            {/* Terms & Policies */}
            <div className="mb-8 mt-6 text-center text-xs leading-relaxed text-gray-500">
              By continuing, you agree to our <br />
              <a href="#" className="text-cyan-600 hover:underline">
                Terms of Service
              </a>
              ,{" "}
              <a href="#" className="text-cyan-600 hover:underline">
                Privacy
              </a>
              , and{" "}
              <a href="#" className="text-cyan-600 hover:underline">
                Refund Policy
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
