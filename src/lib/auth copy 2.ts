import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { CustomAuthError } from "./error";
import { endpoints } from "@/lib/endpoints";

// Helper to refresh access token
async function refreshAccessToken(token: any) {
  try {
    const res = await fetch(endpoints.AUTH.REFRESH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    const data = await res.json();
    if (!res.ok || data.status === "Error") throw new Error("Refresh failed");

    return {
      ...token,
      accessToken: data.data.access_token,
      accessTokenExpires:
        Date.now() + (Number(data.data.expires_in) || 3600) * 1000,
    };
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(endpoints.AUTH.LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          });

          const json = await res.json();
          const user = json?.data?.user;

          // Check if email is not verified (OTP required)
          if (json?.status && user?.email_verified_at === null) {
            throw new CustomAuthError(
              `OtpVerificationRequired:${user?.email ?? "unknown"}`
            );
          }

          if (json?.status && user?.two_factor_enabled) {
            throw new CustomAuthError(`2faEnabled:${user?.email ?? "unknown"}`);
          }

          // Invalid credentials
          if (
            json?.status === false &&
            json?.message === "Invalid credentials"
          ) {
            throw new Error("InvalidCredentials");
          }

          if (!res.ok || !json?.data?.access_token) {
            throw new Error("LoginFailed");
          }

          const { access_token, expires_in } = json.data;

          return {
            id: user.id,
            name: user.first_name,
            email: user.email,
            accessToken: access_token,
            accessTokenExpires:
              Date.now() + (Number(expires_in) || 3600) * 1000,
            email_verified_at: user.email_verified_at,
            two_factor_enabled: user.two_factor_enabled,
          };
        } catch (err: any) {
          console.error("❌ Credentials authorize error:", err);

          if (err instanceof CustomAuthError) throw err;
          if (err instanceof Error && err.message === "InvalidCredentials") {
            throw new Error("InvalidCredentials");
          }
          throw new Error("Unexpected error occurred during login");
        }
      },
    }),

    // 2FA provider (used after OTP verification step)
    CredentialsProvider({
      id: "2fa",
      name: "2FA",
      credentials: {
        email: { label: "Email", type: "email" },
        access_token: { label: "Access Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(endpoints.AUTH.LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          });
          const json = await res.json();
          const user = json?.data?.user;

          // Check if email is not verified (OTP required)
          if (json?.status && user?.email_verified_at === null) {
            throw new CustomAuthError(
              `OtpVerificationRequired:${user?.email ?? "unknown"}`
            );
          }

          // Check if 2FA is enabled
          if (json?.status && user?.two_factor_enabled) {
            throw new CustomAuthError(`2faEnabled:${user?.email ?? "unknown"}`);
          }

          // Invalid credentials
          if (
            json?.status === false &&
            json?.message === "Invalid credentials"
          ) {
            throw new Error("InvalidCredentials");
          }

          if (!res.ok || !json?.data?.access_token) {
            throw new Error("LoginFailed");
          }

          const { access_token, expires_in } = json.data;
          return {
            id: user.id,
            name: user.first_name,
            email: user.email,
            accessToken: access_token,
            accessTokenExpires:
              Date.now() + (Number(expires_in) || 3600) * 1000,
            email_verified_at: user.email_verified_at,
            two_factor_enabled: user.two_factor_enabled,
          };
        } catch (err: any) {
          console.error("❌ Credentials authorize error:", err);
          if (err instanceof CustomAuthError) throw err;
          if (err instanceof Error && err.message === "InvalidCredentials") {
            throw new Error("InvalidCredentials");
          }
          throw new Error("Unexpected error occurred during login");
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account }) {
      console.log("🟢 SignIn Callback:", { user, account });
      if (account?.provider === "google") {
        try {
          const res = await fetch(endpoints.AUTH.SOCIAL_LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              provider: account.provider,
              provider_id: account.providerAccountId, // Use providerAccountId instead of user.id
            }),
          });
          const data = await res.json();
          console.log("Social login response:", data); // Add this line for debugging
          if (data?.data?.access_token) {
            user.accessToken = data.data.access_token;
            return true;
          }
          return false;
        } catch (error) {
          console.error("❌ Social login error:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      console.log("🟢 JWT Callback:", { token, user });

      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.accessTokenExpires =
          user.accessTokenExpires || Date.now() + 3600 * 1000;
        token.email_verified_at = user.email_verified_at;
        token.two_factor_enabled = user.two_factor_enabled;
      }

      if (token.accessTokenExpires && Date.now() >= token.accessTokenExpires) {
        return await refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      console.log("🟢 Session Callback:", { session, token });

      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
