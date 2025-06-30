import type { DefaultSession, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    email_verified_at?: string | null;
    two_factor_enabled?: boolean;
    accessTokenExpires?: number;
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    accessTokenExpires?: number;
    error?: string;
    user?: {
      id?: string;
      email_verified_at?: string | null;
      two_factor_enabled?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    accessToken?: string;
    accessTokenExpires?: number;
    // refreshToken?: string;
    email_verified_at?: string | null;
    two_factor_enabled?: boolean;
  }
}