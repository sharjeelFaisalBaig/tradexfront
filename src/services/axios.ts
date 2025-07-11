import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { getSession, signOut } from "next-auth/react";
import { endpoints } from "@/lib/endpoints";

// ✅ Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ✅ Cache session per request cycle
let sessionCache: any = null;
const getCachedSession = async () => {
  if (!sessionCache) {
    sessionCache = await getSession();
  }
  return sessionCache;
};

// 🔁 Token refresh function
const refreshToken = async (session: any): Promise<string> => {
  const res = await fetch(endpoints.AUTH.REFRESH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.accessToken}`,
    },
  });

  const data = await res.json();

  if (!res.ok || !data?.data?.access_token) {
    console.error("Token refresh failed:", data);
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
    throw new Error("Token refresh failed");
  }

  // ❌ Don't mutate the session directly
  return data.data.access_token;
};

// ➕ Request interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const session = await getCachedSession();

    if (session?.accessToken && config.headers) {
      (
        config.headers as AxiosRequestHeaders
      ).Authorization = `Bearer ${session.accessToken}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 🔁 Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const message = (error.response?.data as any)?.message;

    if (
      status === 401 &&
      message?.toLowerCase().includes("token") &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const session = await getCachedSession();
        const newAccessToken = await refreshToken(session);

        const headers = originalRequest.headers ?? {};
        (
          headers as AxiosRequestHeaders
        ).Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers = headers;

        return axiosInstance(originalRequest); // Retry with new token
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
