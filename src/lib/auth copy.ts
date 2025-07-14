import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { CustomAuthError } from "./error";
import { endpoints } from "@/lib/endpoints";
import axiosInstance from "@/services/axios";

// Helper to refresh access token
async function refreshAccessToken(token: any) {
  try {
    const { data } = await axiosInstance.post(
      endpoints.AUTH.REFRESH,
      {},
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      }
    );

    return {
      ...token,
      accessToken: data.data.access_token,
      accessTokenExpires: Date.now() + (data.data.expires_in || 3600) * 1000,
    };
  } catch (error) {
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
        access_token: { label: "Access Token", type: "text" },
        email_verified_at: { label: "Email Verified At", type: "text" },
        two_factor_enabled: { label: "Two Factor Enabled", type: "text" },
      },
      async authorize(credentials) {
        try {
          const { data } = await axiosInstance.post("/auth/login", credentials);

          if (data?.status && data?.data?.user?.email_verified_at === null) {
            throw new Error(
              "OtpVerificationRequired:" + data?.data?.user?.email
            );
          }

          if (data?.status && data?.data?.user?.two_factor_enabled) {
            throw new CustomAuthError("2faEnabled:" + data?.data?.user?.email);
          }

          if (
            data?.status === false &&
            data?.message === "Invalid credentials"
          ) {
            throw new Error("InvalidCredentials");
          }

          const { access_token, user, expires_in } = data.data;

          return {
            id: user.id,
            name: user.first_name,
            email: user.email,
            accessToken: access_token,
            accessTokenExpires: Date.now() + (expires_in || 3600) * 1000,
            email_verified_at: user.email_verified_at,
            two_factor_enabled: user.two_factor_enabled,
          };
        } catch (err) {
          if (err instanceof CustomAuthError) throw err;

          if (err instanceof Error) {
            if (err.message.startsWith("OtpVerificationRequired:")) throw err;
            if (err.message.startsWith("2faEnabled:")) throw err;
            if (err.message === "InvalidCredentials") throw err;

            try {
              const parsed = JSON.parse(err.message);
              throw new Error(parsed.message);
            } catch (_) {
              throw err;
            }
          }

          throw new Error("Unexpected error occurred");
        }
      },
    }),
    CredentialsProvider({
      id: "2fa",
      name: "2FA",
      credentials: {
        email: { label: "Email", type: "email" },
        access_token: { label: "Access Token", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.access_token && credentials?.email) {
          return {
            id: String(credentials.email),
            email: String(credentials.email),
            accessToken: String(credentials.access_token),
            accessTokenExpires: Date.now() + 3600 * 1000,
          };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const { data } = await axiosInstance.post(
            endpoints.AUTH.SOCIAL_LOGIN,
            {
              name: user.name,
              email: user.email,
              provider: account.provider,
              provider_id: user.id,
            }
          );

          if (data?.data?.access_token) {
            user.accessToken = data.data.access_token;
            return true;
          }
          return false;
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
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
