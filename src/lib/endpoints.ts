const API_BASE_PATH =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tradexfront.isoft-digital.net/api";
export const DOMAIN_ROOT = API_BASE_PATH.replace("/api", "");

interface UploadContent {
  strategyId: string;
  peerId: string;
}

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
    CHECK_PLAN_ELIGIBILITY: (plan_id: string, billing_cycle: string) =>
      `${API_BASE_PATH}/subscription/eligibility/${plan_id}/${billing_cycle}`,
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
    GET_ACTIVITY_BY_ID: (id: string) =>
      `${API_BASE_PATH}/credits/activities/${id}`,
    ACTIVITIES_SUMMARY: `${API_BASE_PATH}/credits/activities-summary`,
    ACTIVITIES_FILTER_OPTIONS: `${API_BASE_PATH}/credits/activities-filter-options`,
  },
  STRATEGY: {
    LIST: `${API_BASE_PATH}/strategies`,
    GET: (id: string) => `${API_BASE_PATH}/strategies/${id}`,
    CREATE: `${API_BASE_PATH}/strategies`,
    COPY: (id: string) => `${API_BASE_PATH}/strategies/${id}/copy`,
    TOGGLE: (id: string) => `${API_BASE_PATH}/strategies/${id}/toggle`,
    FAVOURITE: (id: string) => `${API_BASE_PATH}/strategies/${id}/favourite`,
    UPDATE: (id: string) => `${API_BASE_PATH}/strategies/${id}`,

    // board batch save peer positions
    SAVE_PEER_POSITIONS: (id: string) =>
      `/strategies/${id}/peers/save-positions`,

    // update peer positions endpoint
    UPDATE_PEER_POSITIONS: (id: string, peerId: string, peerType: string) =>
      `/strategies/${id}/peers/${peerType}/${peerId}/position`,

    // board get peer analysis status endpoint
    GET_PEER_ANALYSIS_STATUS: ({
      id,
      peerId,
      peerType,
    }: {
      id: string;
      peerId: string;
      peerType: string;
    }) => `/strategies/${id}/peers/${peerType}/${peerId}/status`,

    // board create peer endpoints
    CREATE_IMAGE_PEER: (id: string) => `/strategies/${id}/peers/image`,
    CREATE_AUDIO_PEER: (id: string) => `/strategies/${id}/peers/audio`,
    CREATE_VIDEO_PEER: (id: string) => `/strategies/${id}/peers/video`,
    CREATE_DOCUMENT_PEER: (id: string) => `/strategies/${id}/peers/document`,
    CREATE_SOCIAL_PEER: (id: string) => `/strategies/${id}/peers/social_media`,
    CREATE_THREAD_PEER: (id: string) => `/strategies/${id}/peers/thread`,
    CREATE_REMOTE_PEER: (id: string) => `/strategies/${id}/peers/remote`,

    // board upload peer endpoints
    UPLOAD_IMAGE_CONTENT: ({ strategyId, peerId }: UploadContent) =>
      `/strategies/${strategyId}/peers/image/${peerId}/upload`,
    UPLOAD_AUDIO_CONTENT: ({ strategyId, peerId }: UploadContent) =>
      `/strategies/${strategyId}/peers/audio/${peerId}/upload`,
    UPLOAD_VIDEO_CONTENT: ({ strategyId, peerId }: UploadContent) =>
      `/strategies/${strategyId}/peers/video/${peerId}/upload`,
    UPLOAD_DOCUMENT_CONTENT: ({ strategyId, peerId }: UploadContent) =>
      `/strategies/${strategyId}/peers/document/${peerId}/upload`,
    UPLOAD_SOCIAL_CONTENT: ({ strategyId, peerId }: UploadContent) =>
      `/strategies/${strategyId}/peers/social_media/${peerId}/upload`,
    UPLOAD_REMOTE_CONTENT: ({ strategyId, peerId }: UploadContent) =>
      `/strategies/${strategyId}/peers/remote/${peerId}/upload`,
    UPLOAD_THREAD_CONTENT: ({ strategyId, peerId }: UploadContent) =>
      `/strategies/${strategyId}/peers/thread/${peerId}/upload`,

    // board delete peer endpoints
    DELETE_IMAGE_PEER: (id: string, peerId: string) =>
      `/strategies/${id}/peers/image/${peerId}`,
    DELETE_AUDIO_PEER: (id: string, peerId: string) =>
      `/strategies/${id}/peers/audio/${peerId}`,
    DELETE_VIDEO_PEER: (id: string, peerId: string) =>
      `/strategies/${id}/peers/video/${peerId}`,
    DELETE_DOCUMENT_PEER: (id: string, peerId: string) =>
      `/strategies/${id}/peers/document/${peerId}`,
    DELETE_SOCIAL_PEER: (id: string, peerId: string) =>
      `/strategies/${id}/peers/social_media/${peerId}`,
    DELETE_REMOTE_PEER: (id: string, peerId: string) =>
      `/strategies/${id}/peers/remote/${peerId}`,
    DELETE_THREAD_PEER: (id: string, peerId: string) =>
      `/strategies/${id}/peers/thread/${peerId}`,

    // board analyze peer endpoints
    ANALYZE_SOCIAL_PEER: (id: string, peerId: string) =>
      `/strategies/${id}/peers/social_media/${peerId}/analyze`,
  },
};
