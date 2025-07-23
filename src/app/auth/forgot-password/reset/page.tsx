"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { endpoints } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Loader from "@/components/common/Loader";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successNote = useSuccessNotifier();

  const email = searchParams.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    const token = sessionStorage.getItem("password_reset_token");
    if (!token) {
      toast({
        title: "Error",
        description: "Session expired. Please restart the reset process.",
        variant: "destructive",
      });
      router.replace("/auth/forgot-password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(endpoints.AUTH.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "Error") {
        const message =
          data?.errors && Object.values(data.errors).flat().join(", ");
        toast({
          title: data.message || "Error",
          description: message || "Failed to reset password.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      successNote({
        title: "Password Reset",
        description: "Your password has been reset. Please log in.",
      });
      sessionStorage.removeItem("reset_access_token");
      router.replace("/auth/signin");
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

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
              Reset Password
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 sm:px-12">
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-gray-100 bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="Enter new password"
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Re-enter New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="Re-enter new password"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 h-12 rounded-full bg-cyan-600 text-white text-lg font-semibold transition-colors hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {loading ? <Loader text="Resetting..." /> : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
