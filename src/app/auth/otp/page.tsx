'use client'

import { useState } from "react";

export default function OtpVerificationPage() {
  const [otp, setOtp] = useState(Array(6).fill(""));

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    const next = document.getElementById(`otp-${index + 1}`);
    if (value && next) (next as HTMLInputElement).focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-6 ">
        <h2 className="text-2xl font-bold">OTP Verification</h2>
        <p className="text-gray-500">
          Already Registered?{" "}
          <a href="/auth/signin" className="font-semibold text-black">Proceed To Log In</a>
        </p>

        {/* OTP Input Boxes */}
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              className="w-full h-12 rounded-full border border-gray-300 text-center text-lg outline-none"
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          className="w-full py-2 rounded-full bg-[#0088CC] text-white text-lg font-semibold"
        >
          Verify
        </button>

        {/* Resend Section */}
        <div className="text-sm text-gray-500 flex justify-between items-center">
          <div>
            Didn’t get code yet?{" "}
            <button className="text-black font-semibold underline">Resend</button>
          </div>
          <div className="text-gray-400">00:00 Sec</div>
        </div>
      </div>
    </div>
  );
}
