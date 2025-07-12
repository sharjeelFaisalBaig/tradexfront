import { getSession, signOut } from "next-auth/react";
import { endpoints } from "@/lib/endpoints";

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
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
    throw new Error("Failed to refresh token");
  }

  const newSession = await getSession();
  if (newSession) {
    newSession.accessToken = data.data.access_token;
  }

  return data.data.access_token;
}

export async function fetchWithAutoRefresh(
  url: string,
  session: any,
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers);
  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    const data = await res.clone().json().catch(() => null);
    if (data?.message === "Token Expired") {
      const newAccessToken = await refreshToken(session);
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      
      res = await fetch(url, {
        ...options,
        headers,
      });
    }
  }

  if (!res.ok) {
    const error: any = new Error("API request failed");
    try {
      error.info = await res.json();
    } catch (e) {
      error.info = { statusText: res.statusText };
    }
    error.status = res.status;
    throw error;
  }

  if (res.status === 204 || !res.headers.get("content-type")?.includes("application/json")) {
    return;
  }

  return res.json();
}