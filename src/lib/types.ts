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

export interface ICollaborator {
    id: string;
    type: 'owner' | 'collaborator';
    is_favourite: boolean;
    is_active: boolean;
    is_online: boolean;
    folder_id: string;
}

export interface IStrategy {
    id: string;
    name: string;
    description: string;
    tags: string[] | null;
    is_template: boolean;
    copied_from_strategy_id: string | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    collaborators?: ICollaborator[];
}