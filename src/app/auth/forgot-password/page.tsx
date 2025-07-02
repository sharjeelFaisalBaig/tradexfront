"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { endpoints } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Loader from "@/components/common/Loader";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(endpoints.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "Error") {
        toast({
          title: "Error",
          description: data.message || "Failed to send OTP.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      toast({
        title: "OTP Sent",
        description: "Please check your email for the OTP.",
      });
      router.replace(`/auth/forgot-password/otp?email=${encodeURIComponent(email)}&expires_in=${data.data?.otp_expires_in || 600}`);
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
              Forgot Password
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 sm:px-12">
            <form onSubmit={handleForgotPassword}>
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="Enter your email"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 h-12 rounded-full bg-cyan-600 text-white text-lg font-semibold transition-colors hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {loading ? <Loader text="Sending..." /> : "Send OTP"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}