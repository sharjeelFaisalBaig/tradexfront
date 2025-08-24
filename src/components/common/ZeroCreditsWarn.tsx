import Link from "next/link";
import React from "react";

const ZeroCreditsWarn = () => {
  return (
    <div className="z-10 px-4 py-1 absolute top-full right-0 w-full text-center border border-yellow-200 bg-yellow-50 text-yellow-900">
      <span>You have 0 credits. Please</span>{" "}
      <Link href={"/profile?tab=subscription"} className="underline">
        subscribe to a membership plan
      </Link>{" "}
      <span>or</span>{" "}
      <Link href={"/profile?tab=credits"} className="underline">
        buy credits
      </Link>{" "}
      <span>to continue using Tradex AI features.</span>
    </div>
  );
};

export default ZeroCreditsWarn;
