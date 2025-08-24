"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/common/Loader";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/hooks/auth/useAuth";
import { showAPIErrorToast } from "@/lib/utils";
import { useEffect } from "react";
import PasswordCriteria from "@/components/common/PasswordCriteria";

// Yup validation schema
// const validationSchema = Yup.object().shape({
//   password: Yup.string()
//     .min(8, "Password must be at least 8 characters")
//     .matches(
//       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
//       "Password must include uppercase, lowercase, number, and special character"
//     )
//     .required("Password is required"),
//   confirmPassword: Yup.string()
//     .required("Please confirm your password")
//     .oneOf([Yup.ref("password")], "Passwords do not match"),
// });

const validationSchema = Yup.object().shape({
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .matches(
      /[A-Z]/,
      "Password must contain at least one uppercase letter (A–Z)"
    )
    .matches(
      /[a-z]/,
      "Password must contain at least one lowercase letter (a–z)"
    )
    .matches(/\d/, "Password must contain at least one number (0–9)")
    .matches(
      /[@$!%*?&]/,
      "Password must contain at least one special character (@$!%*?&)"
    ),

  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("password")], "Passwords do not match"),
});

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successNote = useSuccessNotifier();
  const email = searchParams.get("email") || "";
  const token = sessionStorage.getItem("password_reset_token");

  const { mutate, isPending } = useResetPassword();

  useEffect(() => {
    if (!token || !email) {
      console.log("access denied");
      router.replace("/auth/signin");
      sessionStorage.removeItem("password_reset_token");
    }
  }, [token, email]);

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!token) {
        toast({
          title: "Error",
          description: "Session expired. Please restart the reset process.",
          variant: "destructive",
        });
        router.replace("/auth/forgot-password");
        return;
      }

      mutate(
        {
          token,
          email,
          password: values.password,
        },
        {
          onSuccess: () => {
            successNote({
              title: "Password Reset",
              description: "Your password has been reset. Please log in.",
            });
            router.replace("/auth/signin");
            sessionStorage.removeItem("reset_access_token");
            sessionStorage.removeItem("password_reset_token");
            sessionStorage.removeItem("otpRedirected");
          },
          onError: (error: any) => {
            showAPIErrorToast(error);
          },
        }
      );
      setSubmitting(false);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
      <div className="w-full max-w-md">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-col items-center gap-2 pb-4 pt-8 text-center">
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
              Reset Password
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 sm:px-12">
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div>
                <Label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-gray-100 bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <Label
                  htmlFor="password"
                  className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...formik.getFieldProps("password")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="Enter new password"
                />
                {formik.touched.password && formik.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {formik.errors.password}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Re-enter New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...formik.getFieldProps("confirmPassword")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="Re-enter new password"
                />
                {formik.touched.confirmPassword &&
                  formik.errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {formik.errors.confirmPassword}
                    </p>
                  )}
              </div>
              <Button
                type="submit"
                disabled={formik.isSubmitting || isPending}
                className="my-6 w-full py-3 h-12 rounded-full bg-cyan-600 text-white text-lg font-semibold transition-colors hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {formik.isSubmitting || isPending ? (
                  <Loader direction="row" text="Resetting..." size="md" />
                ) : (
                  "Reset Password"
                )}
              </Button>

              <PasswordCriteria password={formik.values.password} />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
