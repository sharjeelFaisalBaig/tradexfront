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

    if (!res.ok || data.status === "Error") throw data;

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
      type: "credentials",
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
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(credentials),
            }
          );

          // const json = JSON.stringify(await res.json());
          const json = await res.json();
          console.log("response signin: " + JSON.stringify(json));
          // console.log("OtpVerificationRequired1:" + (json?.data?.user?.email_verified_at === null));
          //Handle not verified case
          if (json?.status && json?.data?.user?.email_verified_at === null) {
            // Throw a custom error code
            // console.log("OtpVerificationRequired2:" + json?.data?.user?.email);
            // throw new Error("OtpVerificationRequired:" + json?.data?.user?.email);
            throw new Error("OtpVerificationRequired:" + json?.data?.user?.email);
            // return { error: "OtpVerificationRequired", email: json?.data?.user?.email };
          }

          //handle 2fa
          if (json?.status && json?.data?.user?.two_factor_enabled) {
            // Throw a custom error code
            // console.log("OtpVerificationRequired2:" + json?.data?.user?.email);
            // throw new Error("OtpVerificationRequired:" + json?.data?.user?.email);
            throw new CustomAuthError("2faEnabled:" + json?.data?.user?.email);
            // return { error: "OtpVerificationRequired", email: json?.data?.user?.email };
          }
          // Handle invalid credentials
          if (json?.status === false && json?.message === "Invalid credentials") {
            throw new Error("InvalidCredentials");
          }

          if (!res.ok || !json?.data?.access_token) return null;

          const { access_token, user, expires_in } = json.data;

          return {
            id: user.id,
            name: user.first_name,
            email: user.email,
            accessToken: access_token,
            // refreshToken: json.data.refresh_token, // If your API returns this
            accessTokenExpires: Date.now() + (expires_in || 3600) * 1000,
            email_verified_at: user.email_verified_at,
            two_factor_enabled: user.two_factor_enabled,
          };
        } catch (err) {
          // If the error is an instance of CustomAuthError, rethrow it
          if (err instanceof CustomAuthError) {
            console.log("authorize error:" + err);
            // Handle custom error codes
            if (err instanceof Error && err.message.startsWith("OtpVerificationRequired:")) {
              const email = err.message.split(":")[1];
              // Redirect to OTP verification page
              throw new CustomAuthError("OtpVerificationRequired:" + email);
            }
            if (err instanceof Error && err.message.startsWith("2faEnabled")) {
              // const email = err.message.split(":")[1];
              // Redirect to 2FA verification page
              throw err;
            }
          }
          // if (err instanceof Error && err.message === "2faEnabled") {
          //   const email = err.message.split(":")[1];
          //   // Handle invalid credentials error
          //   throw new Error("2faEnabled:" + email);
          // }
          if (err instanceof Error && err.message === "InvalidCredentials") {
            // Handle invalid credentials error
            throw new Error("InvalidCredentials");
          }
          // Handle other errors
          // If the error is an instance of Error, it might be a stringified JSON
          if (err instanceof Error && err.message.startsWith("{")) {
            const json = JSON.parse(err.message);
            throw new Error(json.message);
          }
          // Log the error for debugging
          // If the error is not an instance of Error, it might be a stringified JSON
          if (typeof err === "string") {
            try {
              const json = JSON.parse(err);
              throw new Error(json.message);
            } catch (parseError) {
              // If parsing fails, rethrow the original error
              throw new Error(err);
            }
          }
          // If the error is not an instance of Error, it might be a stringified JSON
          if (typeof err === "object" && err !== null) {
            try {
              // Attempt to parse the error object
              const json = JSON.stringify(err);
              throw new Error(json);
            } catch (parseError) {
              // If parsing fails, rethrow the original error
              throw new Error("An unexpected error occurred");
            }
          }
          // If error is already a stringified JSON, rethrow it
          // if (err instanceof Error && err.message.startsWith("{")) {
          //   throw err;
          // }
          console.error("❌ authorize error:", err);
          return null;
        }
      },
    }),
    // Add other providers here if needed
    CredentialsProvider({
      id: "2fa",
      name: "2FA",
      credentials: {
        email: { label: "Email", type: "email" },
        access_token: { label: "Access Token", type: "text" },
      },
      async authorize(credentials) {
        console.log("2FA authorize called with credentials:" + JSON.stringify(credentials));
        // Accept the access_token and email from the verify-otp response
        if (credentials?.access_token && credentials?.email) {
          // Optionally, you can verify the token here
          return {
            id: String(credentials.email),
            email: String(credentials.email),
            accessToken: String(credentials.access_token),
            // refreshToken: credentials.refresh_token, // If you have it
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
      return true;
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.accessTokenExpires = user.accessTokenExpires || (Date.now() + 3600 * 1000);
        token.email_verified_at = user.email_verified_at;
        token.two_factor_enabled = user.two_factor_enabled;
      }

      // If token is expired, try to refresh
      if (token.accessTokenExpires && Date.now() >= token.accessTokenExpires) {
        return await refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      // session.accessTokenExpires = token.accessTokenExpires as number | undefined;
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