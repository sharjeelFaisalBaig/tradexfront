import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getUser,
  createUser,
  forgetPassword,
  resetPassword,
  VerifyOtpPayload,
  verifyOtpRequest,
  resendOtpRequest,
} from "@/services/auth/auth_API";
import { SignupData } from "@/services/auth/auth_Mutation";
import { QUERY_KEYS } from "@/lib/queryKeys";

// GET: Current user info
export const useGetUser = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: getUser,
    enabled: enabled,
  });
};

// POST: Register new user
export const useCreateUser = () => {
  return useMutation({
    mutationFn: (data: SignupData) => createUser(data),
    onError: (err) => {
      console.error("Signup failed:", err);
    },
  });
};

// POST: Register new user
export const useForgetPassword = () => {
  return useMutation({
    mutationFn: (data: { email: string }) => forgetPassword(data),
  });
};

// POST: reset password after forget password
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: { token: string; email: string; password: string }) =>
      resetPassword(data),
  });
};

export const useVerifyOtpMutation = () => {
  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => verifyOtpRequest(payload),
  });
};

export const useResendOtpMutation = () => {
  return useMutation({
    mutationFn: (payload: {
      email: string;
      type: "reset" | "2fa" | "verification";
    }) => resendOtpRequest(payload),
  });
};
