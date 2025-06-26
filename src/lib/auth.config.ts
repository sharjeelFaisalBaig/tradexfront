import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { endpoints } from "./endpoints";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const response = await fetch(
            `${process.env.BACKEND_API_URL}${endpoints.AUTH.SIGNIN}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (response.status === 401) {
            console.log(response.status)
            return null
          }

          const { data } = await response.json();

          if (data.user && data.access_token) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              accessToken: data.access_token,
            };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
