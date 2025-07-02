import { endpoints } from "@/lib/endpoints";

export const getCsrfToken = async () => {
  try {
    await fetch(endpoints.AUTH.CSRF_COOKIE, {
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
  }
};
