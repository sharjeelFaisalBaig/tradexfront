// frontend/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { endpoints } from "./endpoints";
import type { NextAuthConfig } from "next-auth";
import authConfig from "./auth.config";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }

  interface Session {
    accessToken?: string;
    error?: string;
  }
}

export const { handlers, signIn, signOut, auth }  = NextAuth({
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const response = await fetch(
            `${process.env.BACKEND_API_URL}/auth/google`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                googleId: user.id,
                image: user.image,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to authenticate with backend");
          }

          const data = await response.json();
          user.accessToken = data.access_token;
          return true;
        } catch (error) {
          console.error("Google auth backend error:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
  if (user) {
    token.accessToken = user.accessToken;
    token.refreshToken = user.refreshToken;
    token.expiresAt = user.expiresAt; // timestamp in ms
  }

  // Check if token is expired
  const isExpired = Date.now() > Number(token.expiresAt);

  if (isExpired) {
    try {
      const res = await fetch(`${process.env.BACKEND_API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      });

      const refreshed = await res.json();

      if (!res.ok) throw new Error("Failed to refresh token");

      token.accessToken = refreshed.access_token;
      token.expiresAt = Date.now() + refreshed.expires_in * 1000;
      token.refreshToken = refreshed.refresh_token ?? token.refreshToken; // optional
    } catch (error) {
      console.error("Refresh token error:", error);
      return { ...token, error: "RefreshAccessTokenError" };
    }
  }

  return token;
},
 
async session({ session, token }) {
  session.accessToken = token.accessToken as any; 
  session.error = token.error as any;
  return session;
}

  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },

  secret: process.env.NEXTAUTH_SECRET,

  ...authConfig
});