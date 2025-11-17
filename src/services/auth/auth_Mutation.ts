import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { createUser } from "./auth_api";

export interface SignupData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface SignupResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      email: string;
    };
    otp_expires_in: number;
  };
}

export function useSignup(): UseMutationResult<
  SignupResponse,
  unknown,
  SignupData
> {
  return useMutation({
    mutationFn: createUser,
  });
}
