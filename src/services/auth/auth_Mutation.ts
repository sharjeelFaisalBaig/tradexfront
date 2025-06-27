import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { createUser } from './auth_API';

export interface SignupData {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
}


interface SignupResponse {
    success: boolean;
    message: string;
}


export function useSignup(): UseMutationResult<SignupResponse, unknown, SignupData> {
    return useMutation({
        mutationFn: createUser,
    });
}