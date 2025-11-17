"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGetUser } from "./auth/useAuth";
import { toast } from "./use-toast";

interface NotifyOptions {
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Custom hook to show success toasts only if
 * the user has enabled in-app notifications (after login).
 */

export const useSuccessNotifier = () => {
  const { isLoggedIn } = useAuth();

  // Fetch user info only if logged in
  const { data, isLoading } = useGetUser({ enabled: isLoggedIn });

  // Extract flag safely
  const isSuccessAlertsEnabled = useMemo(() => {
    if (!isLoggedIn || isLoading) return false; // wait until data is ready
    return Boolean(data?.data?.user?.receive_success_alerts);
  }, [isLoggedIn, isLoading, data]);

  /**
   * notify - show toast if notifications are allowed
   */
  const notify = useCallback(
    ({ title, description, className }: NotifyOptions) => {
      // console.log({ isLoggedIn, isSuccessAlertsEnabled, data });

      if (!isSuccessAlertsEnabled) return; // do nothing if not allowed

      toast({ title, description, className });
    },
    [isSuccessAlertsEnabled]
  );

  return notify;
};

export default useSuccessNotifier;
