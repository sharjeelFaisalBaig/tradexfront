"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Loader from "@/components/common/Loader";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import {
  useResendOtpMutation,
  useVerifyOtpMutation,
} from "@/hooks/auth/useAuth";
import { showAPIErrorToast } from "@/lib/utils";

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  const successNote = useSuccessNotifier();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const expiresIn = searchParams.get("expires_in");
  const redirected = sessionStorage.getItem("otpRedirected");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timer, setTimer] = useState(expiresIn ? parseInt(expiresIn, 10) : 60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyOtpMutation = useVerifyOtpMutation();
  const resendOtpMutation = useResendOtpMutation();

  useEffect(() => {
    if (!redirected || !expiresIn || !email) {
      console.log("access denied");
      router.replace("/auth/signin");
      sessionStorage.removeItem("otpRedirected");
    }
  }, [redirected, expiresIn, email]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
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

    if (enteredOtp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter all 6 digits of the OTP.",
        variant: "destructive",
      });
      return;
    }

    verifyOtpMutation.mutate(
      {
        email,
        otp: enteredOtp,
        type: "reset",
      },
      {
        onSuccess: (res) => {
          sessionStorage.setItem(
            "password_reset_token",
            res?.data?.password_reset_token
          );
          successNote({
            title: "OTP Verified",
            description: "Please set your new password.",
          });
          router.replace(
            `/auth/forgot-password/reset?email=${encodeURIComponent(email)}`
          );
          sessionStorage.removeItem("otpRedirected");
        },
        onError: (error) => {
          showAPIErrorToast(error);
        },
      }
    );
  };

  const handleResend = () => {
    if (timer > 0 || resendOtpMutation.isPending) return;

    const payload: any = { email, type: "reset" };

    resendOtpMutation.mutate(payload, {
      onSuccess: (data) => {
        setTimer(data.data?.otp_expires_in || 60);
        successNote({
          title: "Success",
          description: "A new OTP has been sent to your email.",
        });
      },
      onError: (error) => {
        showAPIErrorToast(error);
      },
    });
  };

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
              OTP Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 sm:px-12">
            <p className="text-gray-500 text-center mb-6">
              An OTP has been sent to <strong>{email}</strong>. Please enter it
              below.
            </p>
            <form onSubmit={handleSubmit}>
              <div
                className="flex justify-center gap-2 mb-6"
                onPaste={handlePaste}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      if (el) inputRefs.current[i] = el;
                    }}
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
                  verifyOtpMutation?.isPending || otp.join("").length !== 6
                }
                className="w-full py-3 h-12 rounded-full bg-cyan-600 text-white text-lg font-semibold transition-colors hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {verifyOtpMutation?.isPending ? (
                  <Loader direction="row" text="Verifying..." />
                ) : (
                  "Verify"
                )}
              </Button>
            </form>
            <div className="mt-6 text-sm text-gray-500 flex justify-between items-center">
              <div>
                Didn't get the code?{" "}
                <button
                  onClick={handleResend}
                  disabled={timer > 0 || resendOtpMutation?.isPending}
                  className={`font-semibold underline transition-colors
                    ${
                      timer > 0 || resendOtpMutation?.isPending
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-cyan-600 hover:text-cyan-700"
                    }`}
                >
                  {resendOtpMutation?.isPending ? "Sending..." : "Resend"}
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
}
