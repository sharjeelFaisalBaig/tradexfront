import { DefaultJWT } from "@auth/core/jwt";
import { DefaultSession } from "next-auth";


declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user?: {
      id?: string;
      email?: string;
      name?: string;
      image?: string;
      email_verified_at?: string | null;
      two_factor_enabled?: boolean;
      accessTokenExpires?: number;
    } & DefaultSession["user"];
  }

  interface JWT extends DefaultJWT {
    accessToken?: string;
  }
}