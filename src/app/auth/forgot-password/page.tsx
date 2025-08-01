"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { useForgetPassword } from "@/hooks/auth/useAuth";
import Loader from "@/components/common/Loader";
import { useFormik } from "formik";
import Image from "next/image";
import * as Yup from "yup";
import { showAPIErrorToast } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const successNote = useSuccessNotifier();

  const {
    error,
    isError,
    isPending: isLoading,
    mutate: forgetPassword,
  } = useForgetPassword();

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Please enter a valid email address.")
      .required("Email is required."),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      forgetPassword(values, {
        onSuccess: (data) => {
          successNote({
            title: "OTP Sent",
            description: "Please check your email for the OTP.",
          });
          router.replace(
            `/auth/forgot-password/otp?email=${encodeURIComponent(
              values.email
            )}&expires_in=${data?.data?.otp_expires_in || 60}` // Why we set 60 conditionaly
          );
        },
        onError: (error: any) => {
          const fallbackTitle = "Failed to send OTP";
          // const fallbackMessage = "Failed to send OTP.";
          showAPIErrorToast(error, fallbackTitle);
        },
      });
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
      <div className="w-full max-w-md">
        <Card className="rounded-2xl shadow-lg">
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
              Forgot Password
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 sm:px-12">
            {isError && (
              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-700 text-center">
                  {/* @ts-ignore */}
                  {error?.response?.data?.message || "Failed to send OTP."}
                </p>
              </div>
            )}

            <form onSubmit={formik.handleSubmit}>
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  disabled={isLoading}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.email}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="Enter your email"
                />
                {formik.touched.email && formik.errors.email ? (
                  <div className="text-red-500 text-xs mt-1">
                    {formik.errors.email}
                  </div>
                ) : null}
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 h-12 rounded-full bg-cyan-600 text-white text-lg font-semibold transition-colors hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {isLoading ? (
                  <Loader direction="row" text="Sending..." />
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
