import { DefaultJWT } from "@auth/core/jwt";
import { DefaultSession } from "next-auth";

export type Tool = "image" | "video" | "document" | "AI Assistant" | string;

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
  aiChartPeers: any[];
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

// user profile interface
export interface StripeDetails {
  id: number;
  membership_plan_id: string;
  stripe_product_id: string;
  stripe_monthly_price_id: string;
  stripe_annual_price_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CurrentPlan {
  id: string;
  name: string;
  stripe_price_id: string | null;
  monthly_price: string;
  monthly_credits: number;
  usd_per_credit: string;
  created_at: string;
  updated_at: string;
  status: boolean;
  description: string;
  extras: any | null;
  annual_price: string | null;
  is_annual: boolean;
  is_monthly: boolean;
  stripe_details: StripeDetails;
}

export interface Subscription {
  id: number;
  name: string;
  stripe_id: string;
  stripe_status: string;
  stripe_price: string;
  quantity: number;
  trial_ends_at: string | null;
  ends_at: string | null;
  created_at: string;
  is_active: boolean;
  is_on_grace_period: boolean;
  is_canceled: boolean;
  is_on_trial: boolean;
  current_plan: CurrentPlan;
}

export interface CreditActivity {
  id: number;
  action_type: "add" | "deduct";
  amount_changed: number;
  reason: string;
  event: string | null;
  created_at: string;
}

export interface Credits {
  current_credits: number;
  recent_activities: CreditActivity[];
  total_earned_this_month: number;
  total_spent_this_month: number;
}

// user.ts
export interface IUser {
  id: string | number;
  name: string;
  email: string;
  email_verified_at: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
  user_type: string;
  extras: any | null;
  first_name: string;
  last_name: string;
  otp_expires_at: string | null;
  stripe_id: string | null;
  pm_type: string | null;
  pm_last_four: string | null;
  trial_ends_at: string | null;
  google_id: string | null;
  credits: number;
  two_factor_enabled: boolean;
  two_factor_expires_at: string | null;
  two_factor_verified_at: string | null;
  receive_email_notifications: boolean;
  receive_inapp_notifications: boolean;
  avatar: string | null;
  phone_number: string | null;
  receive_success_alerts: boolean;
}

export interface UserProfile {
  user: IUser;
  credits: Credits;
  subscription: Subscription;
}

export interface Folder {
  id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  created_by: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  parent_folder_id: string | null;
  children: Folder[];
  parent: Folder | null;
}
