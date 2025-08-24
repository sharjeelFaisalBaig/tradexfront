"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { endpoints } from "@/lib/endpoints";
import ClientWrapper from "@/components/ClientWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signIn } from "next-auth/react";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import Loader from "@/components/common/Loader";
import { resendOtpRequest, verifyOtpRequest } from "@/services/auth/auth_API";
import { showAPIErrorToast } from "@/lib/utils";

const OtpVerificationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successNote = useSuccessNotifier();
  const redirected = sessionStorage.getItem("otpRedirected");
  const email = searchParams.get("email")?.replace(" ", "+");
  const twoFactorEnabled = searchParams.get("2fa");
  const expiresIn = searchParams.get("expires_in");
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timer, setTimer] = useState(expiresIn ? parseInt(expiresIn, 10) : 600);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!redirected || !expiresIn || !email) {
      console.log("access denied");
      router.replace("/auth/signin");
      sessionStorage.removeItem("otpRedirected");
    }
  }, [redirected, expiresIn, email]);

  useEffect(() => {
    if (!email) {
      toast({
        title: "Error",
        description: "No email address provided. Redirecting to signup.",
        variant: "destructive",
      });
      router.replace("/auth/signup");
    }
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => Math.max(prevTimer - 1, 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, email, router]);

  const verify2faMutation = useMutation({
    mutationFn: (otp: string) =>
      fetch(endpoints.AUTH.VERIFY_2FA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, type: "2fa" }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.status === "Error") throw data;
        return data;
      }),
    onSuccess: (data) => {
      setVerifying(true);
      successNote({
        title: "Success",
        description: "2FA verified successfully.",
      });
      signIn("2fa", {
        email,
        access_token: data.data.access_token,
        redirect: false,
      }).then(() => {
        setTimeout(() => router.replace("/dashboard"), 1200);
        setTimeout(() => sessionStorage.removeItem("otpRedirected"), 1500);
      });
    },
    onError: (error: any) => {
      showAPIErrorToast(error, "Validation failed", "Invalid or expired OTP.");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (otp: string) =>
      verifyOtpRequest({ email: email ?? "", otp, type: "verification" }),
    onSuccess: () => {
      setVerifying(true);
      successNote({
        title: "Success",
        description: "OTP verified successfully. Please log in.",
      });
      setTimeout(() => router.replace("/auth/signin"), 1200);
      setTimeout(() => sessionStorage.removeItem("otpRedirected"), 1500);
    },
    onError: (error: any) => {
      showAPIErrorToast(error, "Validation failed", "Invalid or expired OTP.");
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: () =>
      resendOtpRequest({ email: email ?? "", type: "verification" }),
    onSuccess: (data) => {
      setTimer(data?.data?.otp_expires_in ?? 0);
      successNote({
        title: "Success",
        description: "A new OTP has been sent to your email.",
      });
    },
    onError: (error: any) => {
      showAPIErrorToast(error, "Validation failed", "Failed to resend OTP.");
    },
  });

  const resend2faMutation = useMutation({
    mutationFn: () => resendOtpRequest({ email: email ?? "", type: "2fa" }),
    onSuccess: (data) => {
      setTimer(data?.data?.otp_expires_in ?? 0);
      successNote({
        title: "Success",
        description: "A new OTP has been sent to your email.",
      });
    },
    onError: (error) => {
      showAPIErrorToast(error, "Validation failed", "Failed to resend OTP.");
    },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").trim();
    if (!/^\d{6}$/.test(pasteData)) {
      toast({
        title: "Error",
        description: "Please paste a valid 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }
    const otpArray = pasteData.split("").slice(0, 6);
    setOtp(otpArray);
    inputRefs.current.forEach((input, index) => {
      if (input) input.value = otpArray[index];
    });
    inputRefs.current[inputRefs.current.length - 1]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join("");

    if (enteredOtp.length === 6) {
      twoFactorEnabled === "true"
        ? verify2faMutation.mutate(enteredOtp)
        : verifyOtpMutation.mutate(enteredOtp);
    } else {
      toast({
        title: "Validation Error",
        description: "Please enter all 6 digits of the OTP.",
        variant: "destructive",
      });
    }
  };

  const handleResend = () => {
    if (timer === 0) {
      twoFactorEnabled === "true"
        ? resend2faMutation.mutate()
        : resendOtpMutation.mutate();
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-12 w-12 text-cyan-600 mb-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span className="text-cyan-600 text-lg font-semibold">
            Redirecting...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f6f8fb] p-4 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg">
        <div className="rounded-t-[20px] border border-[#0088CC1C] bg-[#0088CC1C] py-2 px-3 text-left dark:border-[#0088CC1C] dark:bg-cyan-900/20">
          <p className="flex items-center gap-2 text-base font-medium text-cyan-600 dark:text-cyan-300">
            OTP Verification
          </p>
        </div>
        <Card className="rounded-b-[20px] rounded-t-none border-0 shadow-lg">
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
              Please check your email
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 sm:px-12">
            <p className="text-gray-500 text-center mb-6">
              An OTP has been sent to <strong>{email}</strong>. Please enter it
              below.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      if (el) inputRefs.current[i] = el;
                    }}
                    id={`otp-${i}`}
                    type="tel"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-12 rounded-lg border border-gray-300 text-center text-2xl outline-none
                      focus:ring-2 focus:ring-cyan-500
                      bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-100
                      placeholder-gray-400"
                    style={{ caretColor: "#06b6d4" }}
                  />
                ))}
              </div>
              <Button
                type="submit"
                disabled={
                  otp.join("").length !== 6 ||
                  verifyOtpMutation.isPending ||
                  verify2faMutation.isPending
                }
                className="w-full mt-8 py-3 h-12 rounded-full bg-cyan-600 text-white text-lg font-semibold transition-colors hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {verifyOtpMutation.isPending || verify2faMutation.isPending ? (
                  <Loader direction="row" text="Verifying..." size="md" />
                ) : (
                  "Verify"
                )}
              </Button>
            </form>
            <div className="mt-6 text-sm text-gray-500 flex justify-between items-center">
              <div>
                Didn’t get the code?{" "}
                <button
                  onClick={handleResend}
                  disabled={
                    timer > 0 ||
                    (twoFactorEnabled === "true"
                      ? resend2faMutation.isPending
                      : resendOtpMutation.isPending)
                  }
                  className={`font-semibold underline transition-colors ${
                    timer > 0 ||
                    (twoFactorEnabled === "true"
                      ? resend2faMutation.isPending
                      : resendOtpMutation.isPending)
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-cyan-600 hover:text-cyan-700"
                  }`}
                >
                  {twoFactorEnabled === "true"
                    ? resend2faMutation.isPending
                      ? "Sending..."
                      : "Resend"
                    : resendOtpMutation.isPending
                    ? "Sending..."
                    : "Resend"}
                </button>
              </div>
              {timer > 0 && (
                <div className="text-lg font-medium text-gray-600">
                  {String(Math.floor(timer / 60)).padStart(2, "0")}:
                  {String(timer % 60).padStart(2, "0")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SuspendedOtpPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ClientWrapper>
      <OtpVerificationPage />
    </ClientWrapper>
  </Suspense>
);

export default SuspendedOtpPage;
