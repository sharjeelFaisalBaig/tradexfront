import { signIn, getSession } from "next-auth/react";
import { endpoints } from "@/lib/endpoints";

export async function fetchWithAutoRefresh(url: string, session: any, options: RequestInit = {}) {
  // 1st attempt
  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${session?.accessToken}`,
      "Content-Type": "application/json",
    },
  });
  let data = await res.json();

  // If token expired, refresh and retry
  if (data?.message === "Token Expired" || data?.message === "Invalid Token") {
    // Call refresh endpoint
    const refreshRes = await fetch(endpoints.AUTH.REFRESH, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const refreshData = await refreshRes.json();

    if (refreshData?.data?.access_token) {
      // Update session with new token using signIn (credentials provider)
      await signIn("credentials", {
        email: session?.user?.email,
        access_token: refreshData.data.access_token,
        redirect: false,
      });

      // Get updated session
      const newSession = await getSession();

      // Retry original API call with new token
      res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${refreshData.data.access_token}`,
          "Content-Type": "application/json",
        },
      });
      data = await res.json();
    }
  }

  return data;
}