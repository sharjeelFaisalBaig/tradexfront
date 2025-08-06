import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getUser,
  createUser,
  forgetPassword,
  resetPassword,
  VerifyOtpPayload,
  verifyOtpRequest,
  resendOtpRequest,
  updateProfile,
  cancelSubscription,
  uploadAvatar,
  deleteAvatar,
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

// POST: Upload user profile avatar/ profile picture
export const useUploadAvatarMutation = () => {
  return useMutation({
    mutationFn: (payload: { avatar: File }) => uploadAvatar(payload),
    // onSuccess: (data, variables, context) => {},
  });
};

// DELETE: Delete user profile avatar/ profile picture
export const useDeleteAvatarMutation = () => {
  return useMutation({
    mutationFn: () => deleteAvatar(),
    // onSuccess: (data, variables, context) => {},
  });
};

// PUT: Update user profile data
export const useUpdateProfileMutation = () => {
  return useMutation({
    mutationFn: (payload: any) => updateProfile(payload),
    // onSuccess: (data, variables, context) => {},
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

export const useCancelSubscriptionMutation = () => {
  return useMutation({
    mutationFn: () => cancelSubscription(),
  });
};
