"use client";

import { useCallback, useMemo } from "react";
import { toast } from "./use-toast";
import { useGetUser } from "./auth/useAuth";
import { auth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

export const useSuccessNotifier = () => {
  // const { isLoggedIn } = useAuth();

  // const session = await auth();
  // console.log({ session });

  // const { data } = useGetUser();
  // const isInAppNotificationsEnabled = useMemo(
  // () => data?.data?.user?.receive_inapp_notifications,
  // [data]
  // );

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
