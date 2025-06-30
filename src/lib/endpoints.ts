const API_BASE_PATH = process.env.NEXT_PUBLIC_API_URL || "https://tradexfront.isoft-digital.net/api";
const DOMAIN_ROOT = API_BASE_PATH.replace("/api", "");

export const endpoints = {
    AUTH: {
        LOGIN: `${API_BASE_PATH}/auth/login`,
        SIGNUP: `${API_BASE_PATH}/auth/register`,
        FORGOT_PASSWORD: `${API_BASE_PATH}/auth/forgot-password`,
        RESET_PASSWORD: `${API_BASE_PATH}/auth/reset-password`,
        VERIFY_OTP: `${API_BASE_PATH}/auth/verify-otp`,
        VERIFY_2FA: `${API_BASE_PATH}/auth/verify-otp`,
        RESEND_OTP: `${API_BASE_PATH}/auth/resend-otp`,
        REFRESH: `${API_BASE_PATH}/auth/refresh`,
        CSRF_COOKIE: `${DOMAIN_ROOT}/sanctum/csrf-cookie`,
    },
    USER: {
        PROFILE: `${API_BASE_PATH}/auth/me`,
    },
    PLANS: {
        GET_ALL_PLANS: `${API_BASE_PATH}/membership/plans`,
        GET_PLAN_BY_ID: (id: string) => `${API_BASE_PATH}/membership/plans/${id}`,
        CHECK_PLAN_ELIGIBILITY: (plan_id: string, billing_cycle: string) => `${API_BASE_PATH}/subscription/eligibility/${plan_id}/${billing_cycle}`,
    }
}