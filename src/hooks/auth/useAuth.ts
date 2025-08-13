import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  getSubscriptionPlans,
  canChangePlan,
  createSubscription,
  updateSubscription,
  getBillingHistory,
  getFilterOptions,
  deleteUserAccount,
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

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => updateProfile(payload),
    onSuccess: (profileNewData) => {
      queryClient.setQueryData([QUERY_KEYS.USER], (oldData: any) => {
        return { ...oldData, data: { ...profileNewData?.data } };
      });
    },
  });
};

// POST: Upload user profile avatar/ profile picture
export const useUploadAvatarMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { avatar: File }) => uploadAvatar(payload),
    onSuccess: (profileNewData) => {
      queryClient.setQueryData([QUERY_KEYS.USER], (oldData: any) => {
        console.log({ updateProfile_uploadAvatar: oldData, profileNewData });
        return { ...oldData, data: { ...profileNewData?.data } };
      });
    },
  });
};

// DELETE: Delete user profile avatar/ profile picture
export const useDeleteAvatarMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAvatar(),
    onSuccess: (profileNewData) => {
      queryClient.setQueryData([QUERY_KEYS.USER], (oldData: any) => {
        console.log({ updateProfile_deleteAvatar: oldData, profileNewData });
        return { ...oldData, data: { ...profileNewData?.data } };
      });
    },
  });
};

// Delete user account
export const useDeleteUserAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteUserAccount(),
    onSuccess: (data) => {
      console.log("Account deleted successfully", data);
      // queryClient.setQueryData([QUERY_KEYS.USER], (oldData: any) => {
      //   console.log({ updateProfile_deleteAvatar: oldData, profileNewData });
      //   return { ...oldData, data: { ...profileNewData?.data } };
      // });
    },
  });
};

// POST: Register new user
export const useCreateUser = () => {
  return useMutation({
    mutationFn: (data: SignupData) => createUser(data),
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

// SUBACRIPTION MUTATIONS
export const useCanChangePlan = () => {
  return useMutation({
    mutationFn: (payload: { new_membership_plan_id: string }) =>
      canChangePlan(payload),
  });
};

export const useGetSubscriptionPlans = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PLANS],
    queryFn: getSubscriptionPlans,
    enabled: enabled,
  });
};

export const useCreateSubscriptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      membership_plan_id: string;
      billing_cycle: "annual" | "monthly";
    }) => createSubscription(payload),
    onSuccess: (newData) => {
      console.log({ create_sub_new_data: newData });

      queryClient.setQueryData([QUERY_KEYS.USER], (oldData: any) => {
        return {
          ...oldData,
          data: {
            ...oldData?.data,
            subscription: null,
            permissions: {
              can_subscribe: true,
              subscription_block_reason: null,
            },
          },
        };
      });
    },
  });
};

export const useUpdateSubscriptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      new_membership_plan_id: string;
      new_billing_cycle: "annual" | "monthly";
    }) => updateSubscription(payload),
    onSuccess: (newData) => {
      console.log({ update_sub_new_data: newData });

      queryClient.setQueryData([QUERY_KEYS.USER], (oldData: any) => {
        return {
          ...oldData,
          data: {
            ...oldData?.data,
            subscription: null,
            permissions: {
              can_subscribe: true,
              subscription_block_reason: null,
            },
          },
        };
      });
    },
  });
};

export const useCancelSubscriptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      queryClient.setQueryData([QUERY_KEYS.USER], (oldData: any) => {
        return {
          ...oldData,
          data: {
            ...oldData?.data,
            subscription: null,
            permissions: {
              can_subscribe: true,
              subscription_block_reason: null,
            },
          },
        };
      });
    },
  });
};

// get billing history
export const useGetBillingHistory = (params: any) => {
  return useQuery({
    queryKey: [QUERY_KEYS.BILLING_HISTORY, params],
    queryFn: () => getBillingHistory(params),
    enabled: !!params?.page, // Only fetch if page is defined
    // keepPreviousData: true, // Helps with pagination
  });
};

// get filter options
export const useGetFilterOptions = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.BILLING_FILTER_OPTIONS],
    queryFn: () => getFilterOptions(),
  });
};
