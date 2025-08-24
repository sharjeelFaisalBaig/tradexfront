import { endpoints } from "@/lib/endpoints";
import { SignupData } from "./auth_Mutation";
import axiosInstance from "../axios";

// Get logged-in user profile
export const getUser = async () => {
  const response = await axiosInstance.get(endpoints.USER.PROFILE);
  return response.data;
};

export const uploadAvatar = async (payload: { avatar: File }) => {
  const response = await axiosInstance.post(
    endpoints.USER.UPLOAD_AVATAR,
    payload,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response?.data;
};

export const deleteAvatar = async () => {
  const response = await axiosInstance.delete(endpoints.USER.DELETE_AVATAR);
  return response?.data;
};

export const updateProfile = async (payload: any) => {
  const response = await axiosInstance.put(
    endpoints.USER.UPDATE_PROFILE,
    payload
  );
  return response?.data;
};

// delete user account
export const deleteUserAccount = async () => {
  const response = await axiosInstance.delete(endpoints.USER.DELETE_ACCOUNT);
  return response?.data;
};

// Register a new user
export const createUser = async (userData: SignupData) => {
  const response = await axiosInstance.post(endpoints.AUTH.SIGNUP, userData);
  return response.data;
};

// forget password
export const forgetPassword = async (userData: { email: string }) => {
  const response = await axiosInstance.post(
    endpoints.AUTH.FORGOT_PASSWORD,
    userData
  );
  return response.data;
};

export const resetPassword = async (userData: {
  token: string;
  email: string;
  password: string;
}) => {
  const response = await axiosInstance.post(
    endpoints.AUTH.RESET_PASSWORD,
    userData
  );
  return response.data;
};

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  type?: string | "reset" | "2fa";
}

export const verifyOtpRequest = async (payload: VerifyOtpPayload) => {
  const response = await axiosInstance.post(endpoints.AUTH.VERIFY_OTP, payload);
  return response;
};

export interface ResendOtpResponse {
  message?: string;
  status: string;
  data?: {
    otp_expires_in: number;
  };
}

export const resendOtpRequest = async (payload: {
  email: string;
  type: "reset" | "2fa" | "verification";
}): Promise<ResendOtpResponse> => {
  const response = await axiosInstance.post(endpoints.AUTH.RESEND_OTP, payload);
  return response?.data;
};

// SUBSCRIPTION MUTATION FUNCTIONS
export interface SubPlansResponse {
  message?: string;
  status: string;
  data?: any;
}

// get subscription plans
export const getSubscriptionPlans = async () => {
  const response = await axiosInstance.get(endpoints.PLANS.GET_ALL_PLANS);
  return response?.data;
};

// can change subscription plan
export const canChangePlan = async (payload: {
  new_membership_plan_id: string;
}) => {
  const response = await axiosInstance.post(
    endpoints.PLANS.CAN_CHANGE_PLAN,
    payload
  );
  return response?.data;
};

// create subscription
export const createSubscription = async (payload: {
  membership_plan_id: string;
  billing_cycle: "annual" | "monthly";
}) => {
  const response = await axiosInstance.post(
    endpoints.SUBSCRIPTION.CREATE_PAYMENT_INTENT,
    payload
  );
  return response?.data;
};

// create subscription
export const updateSubscription = async (payload: {
  new_membership_plan_id: string;
  new_billing_cycle: "annual" | "monthly";
}) => {
  const response = await axiosInstance.post(
    endpoints.SUBSCRIPTION.UPDATE_SUBSCRIPTION,
    payload
  );
  return response?.data;
};

// cancel subscription
export const cancelSubscription = async () => {
  const response = await axiosInstance.post(
    endpoints.SUBSCRIPTION.CANCEL_SUBSCRIPTION
  );
  return response?.data;
};

// get billing history
export const getBillingHistory = async (params: any) => {
  const response = await axiosInstance.get(endpoints.BILLING.HISTORY, {
    params,
  });
  return response?.data;
};

// get filter options for billing history
export const getFilterOptions = async () => {
  const response = await axiosInstance.get(endpoints.BILLING.FILTER_OPTIONS);
  return response?.data;
};
