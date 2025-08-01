"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { endpoints } from "@/lib/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Loader from "@/components/common/Loader";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  const successNote = useSuccessNotifier();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const expiresIn = searchParams.get("expires_in");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(expiresIn ? parseInt(expiresIn, 10) : 60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    setLoading(true);
    try {
      const res = await fetch(endpoints.AUTH.VERIFY_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: enteredOtp, type: "reset" }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "Error") {
        toast({
          title: "Error",
          description: data.message || "Invalid or expired OTP.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      sessionStorage.setItem("password_reset_token", data.password_reset_token);
      successNote({
        title: "OTP Verified",
        description: "Please set your new password.",
      });
      router.replace(
        `/auth/forgot-password/reset?email=${encodeURIComponent(email)}`
      );
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    try {
      const res = await fetch(endpoints.AUTH.RESEND_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "reset" }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "Error") {
        toast({
          title: "Error",
          description: data.message || "Failed to resend OTP.",
          variant: "destructive",
        });
      } else {
        setTimer(data.data?.otp_expires_in || 60);
        successNote({
          title: "Success",
          description: "A new OTP has been sent to your email.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
    setResending(false);
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
                disabled={loading || otp.join("").length !== 6}
                className="w-full py-3 h-12 rounded-full bg-cyan-600 text-white text-lg font-semibold transition-colors hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {loading ? (
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
                  disabled={timer > 0 || resending}
                  className={`font-semibold underline transition-colors
                    ${
                      timer > 0 || resending
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-cyan-600 hover:text-cyan-700"
                    }`}
                >
                  {resending ? "Sending..." : "Resend"}
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
