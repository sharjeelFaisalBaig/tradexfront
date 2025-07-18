"use client";

import { useCallback, useMemo } from "react";
import { toast } from "./use-toast";
import { useGetUser } from "./auth/useAuth";

export const useSuccessNotifier = () => {
  const { data } = useGetUser();

  const isInAppNotificationsEnabled = useMemo(
    () => data?.data?.user?.receive_inapp_notifications,
    [data]
  );

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
