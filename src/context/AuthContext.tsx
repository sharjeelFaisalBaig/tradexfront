"use client";

import { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import React, { createContext, useContext } from "react";

type AuthProviderProps = {
  children: React.ReactNode;
  session: Session | null;
};

type AuthContextType = {
  isLoggedIn: boolean;
  user: Session["user"] | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

// Context create
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children, session }: AuthProviderProps) => {
  return (
    <SessionProvider session={session}>
      <AuthContextWrapper>{children}</AuthContextWrapper>
    </SessionProvider>
  );
};

// Wrapper component jo Session ko context me provide karega
const AuthContextWrapper = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();

  const value: AuthContextType = {
    isLoggedIn: status === "authenticated",
    user: session?.user ?? null,
    status,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

// "use client";

// import { Session } from "next-auth";
// import { SessionProvider } from "next-auth/react";
// import React from "react";

// type AuthProviderProps = {
//   children: React.ReactNode;
//   session: Session | null;
// };

// const AuthProvider = ({ children, session }: AuthProviderProps) => {
//   return <SessionProvider session={session}>{children}</SessionProvider>;
// };

// export default AuthProvider;
