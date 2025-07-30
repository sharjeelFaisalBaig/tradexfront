"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGetUser } from "./auth/useAuth";
import { toast } from "./use-toast";

export const useSuccessNotifier = () => {
  // const { isLoggedIn, user } = useAuth();

  // const { data } = useGetUser({ enabled: isLoggedIn });

  // const isInAppNotificationsEnabled = useMemo(
  //   () => data?.data?.user?.receive_inapp_notifications,
  //   [data]
  // );

  // console.log("useSuccessNotifier", {
  //   isLoggedIn,
  //   user,
  //   data,
  //   isInAppNotificationsEnabled,
  // });

  const isInAppNotificationsEnabled = true;

  const notify = useCallback(
    async ({ title, description }: { title: string; description?: string }) => {
      if (isInAppNotificationsEnabled) {
        toast({
          title,
          description: description,
        });
      }
    },
    []
  );

  return notify;
};

export default useSuccessNotifier;
