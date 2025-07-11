import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUser, createUser } from "@/services/auth/auth_API";
import { SignupData } from "@/services/auth/auth_Mutation";
import { QUERY_KEYS } from "@/lib/queryKeys";

// GET: Current user info
export const useGetUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: getUser,
  });
};

// POST: Register new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignupData) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
    },
    onError: (err) => {
      console.error("Signup failed:", err);
    },
  });
};
