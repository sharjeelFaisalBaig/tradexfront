import { getSession, signOut } from "next-auth/react";
import { endpoints } from "@/lib/endpoints";
import { authConfig } from "./auth"; // Assuming authConfig is exported from auth.ts

async function refreshToken(session: any) {
  const res = await fetch(endpoints.AUTH.REFRESH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  const data = await res.json();

  if (!res.ok || !data.data.access_token) {
    // If refresh fails, sign out the user
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
    throw new Error("Failed to refresh token");
  }

  // This is a placeholder for updating the session.
  // In a real app, you would use a method to update the session state globally.
  // For NextAuth.js, you might need to trigger a session update.
  // The logic below is a simplified representation.
  const newSession = await getSession(); // Refetch session to get the latest state
  if (newSession) {
    newSession.accessToken = data.data.access_token;
    // Here you would ideally trigger a session update.
    // For now, we'll just return the new token.
  }

  return data.data.access_token;
}

export async function fetchWithAutoRefresh(
  url: string,
  session: any,
  options: RequestInit = {}
) {
  const headers: any = {
    ...(options.headers || {}),
    Authorization: `Bearer ${session?.accessToken}`,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(url, {
    ...options,
    headers,
  });

  let data = await res.json();

  if (res.status === 401 && data?.message === "Token Expired") {
    const newAccessToken = await refreshToken(session);

    // Retry the request with the new token
    const newHeaders: any = {
      ...(options.headers || {}),
      Authorization: `Bearer ${newAccessToken}`,
    };

    if (!(options.body instanceof FormData)) {
      newHeaders["Content-Type"] = "application/json";
    }

    res = await fetch(url, {
      ...options,
      headers: newHeaders,
    });
    data = await res.json();
  }

  return data;
}