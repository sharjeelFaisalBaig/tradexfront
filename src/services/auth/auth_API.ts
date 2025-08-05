import { endpoints } from "@/lib/endpoints";
import { SignupData } from "./auth_Mutation";
import axiosInstance from "../axios";

// Get logged-in user profile
export const getUser = async () => {
  const response = await axiosInstance.get(endpoints.USER.PROFILE);
  return response.data;
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
