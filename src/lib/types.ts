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

export interface StrategyFlowEdge {
  id: string;
  source_peer_type: string;
  source_peer: string;
  target_peer: string;
  strategy_collaborator_id: string;
}

export interface IStrategyFlow {
  id: string;
  is_active: boolean;
  last_opened_at: string;
  created_at: string;
  aiImagePeers: any[];
  aiVideoPeers: any[];
  aiAudioPeers: any[];
  aiDocsPeers: any[];
  aiRemotePeers: any[];
  aiSocialMediaPeers: any[];
  aiThreadPeers: any[];
  annotationPeers: any[];
  strategyFlowEdges?: StrategyFlowEdge[];
}

export interface IStrategyCollaborator {
  id: string;
  type?: "owner";
  is_favourite?: true;
  is_active?: true;
  is_online?: true;
  folder_id?: string;
  folder?: {
    id?: string;
    name?: string;
  };
  user?: {
    id?: string | number;
    name?: string;
    email?: string;
  };
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
  is_favourite?: boolean;
  flows?: IStrategyFlow[];
  collaborators?: IStrategyCollaborator[];
}

export type Tool = "image" | "video" | "document" | "AI Assistant" | string;
