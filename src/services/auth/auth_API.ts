import { endpoints } from "@/lib/endpoints";
import { SignupData } from "./auth_Mutation";
import { getSession } from "next-auth/react";

// Helper function to get a cookie by name
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") {
    return null;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

const getAuthHeaders = async () => {
  const session = await getSession();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  // Manually add the XSRF-TOKEN header for CSRF protection
  const xsrfToken = getCookie("XSRF-TOKEN");
  if (xsrfToken) {
    headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfToken);
  }

  return headers;
};

export const getUsers = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(endpoints.USER.PROFILE, {
    headers,
    credentials: "include",
  });
  return await response.json();
};

export const createUser = async (userData: SignupData) => {
  const headers = await getAuthHeaders();
  const response = await fetch(endpoints.AUTH.SIGNUP, {
    method: "POST",
    headers,
    body: JSON.stringify(userData),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }

  return await response.json();
};