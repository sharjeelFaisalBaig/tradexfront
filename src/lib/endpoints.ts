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
        SOCIAL_LOGIN: `${API_BASE_PATH}/auth/social-login`,
        CSRF_COOKIE: `${DOMAIN_ROOT}/sanctum/csrf-cookie`,
    },
    USER: {
        PROFILE: `${API_BASE_PATH}/auth/me`,
        UPDATE_PROFILE: `${API_BASE_PATH}/auth/profile`,
        UPLOAD_AVATAR: `${API_BASE_PATH}/auth/avatar`,
        DELETE_AVATAR: `${API_BASE_PATH}/auth/avatar`,
    },
    PLANS: {
        GET_ALL_PLANS: `${API_BASE_PATH}/membership/plans`,
        GET_PLAN_BY_ID: (id: string) => `${API_BASE_PATH}/membership/plans/${id}`,
        CHECK_PLAN_ELIGIBILITY: (plan_id: string, billing_cycle: string) => `${API_BASE_PATH}/subscription/eligibility/${plan_id}/${billing_cycle}`,
        CAN_CHANGE_PLAN: `${API_BASE_PATH}/subscription/can-change-plan`,
    },
    SUBSCRIPTION: {
        CREATE_PAYMENT_INTENT: `${API_BASE_PATH}/subscription/frontend/payment-intent`,
        CONFIRM_PAYMENT: `${API_BASE_PATH}/subscription/frontend/confirm-payment`,
        CANCEL_SUBSCRIPTION: `${API_BASE_PATH}/subscription/cancel`,
        UPDATE_SUBSCRIPTION: `${API_BASE_PATH}/subscription/update`,
        SUBSCRIPTION_STATUS: `${API_BASE_PATH}/subscription/status`,
        GET_PAYMENT_METHOD: `${API_BASE_PATH}/subscription/payment-method`,
        UPDATE_PAYMENT_METHOD: `${API_BASE_PATH}/subscription/payment-method`,
    },
    BILLING: {
        HISTORY: `${API_BASE_PATH}/billing/history`,
        STATS: `${API_BASE_PATH}/billing/stats`,
        GET_RECORD: (id: string) => `${API_BASE_PATH}/billing/history/${id}`,
        FILTER_OPTIONS: `${API_BASE_PATH}/billing/filter-options`,
    },
    CREDITS: {
        INFO: `${API_BASE_PATH}/credits/info`,
        CREATE_PAYMENT_INTENT: `${API_BASE_PATH}/credits/purchase/payment-intent`,
        CONFIRM_PURCHASE: `${API_BASE_PATH}/credits/purchase/confirm`,
        ACTIVITIES: `${API_BASE_PATH}/credits/activities`,
        GET_ACTIVITY_BY_ID: (id: string) => `${API_BASE_PATH}/credits/activities/${id}`,
        ACTIVITIES_SUMMARY: `${API_BASE_PATH}/credits/activities-summary`,
        ACTIVITIES_FILTER_OPTIONS: `${API_BASE_PATH}/credits/activities-filter-options`,
    }
}