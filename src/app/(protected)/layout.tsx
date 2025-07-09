import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return <>{children}</>;
};

export default ProtectedLayout;
