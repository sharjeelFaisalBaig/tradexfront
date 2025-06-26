const BASE_PATH = process.env.NEXT_PUBLIC_BACKEND_API_URL 

export const endpoints = {
    AUTH: {
        SIGNIN: `${BASE_PATH}/auth/login`,
        SIGNUP: `${BASE_PATH}/auth/register`,
        FORGOT_PASSWORD: `${BASE_PATH}/auth/forgot-password`,
        RESET_PASSWORD: `${BASE_PATH}/auth/reset-password`,
        VERIFY_OTP: `${BASE_PATH}/auth/verify-otp`,
        RESEND_OTP: `${BASE_PATH}/auth/resend-otp`,
        REFRESH: `${BASE_PATH}/auth/refresh`
    },
    USER: {
        PROFILE: `${BASE_PATH}/auth/me`,
    }
}