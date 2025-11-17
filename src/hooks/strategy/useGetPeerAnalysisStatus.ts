"use client";

import { useCredits } from "@/context/CreditContext";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { getPeerAnalysisStatus } from "@/services/strategy/strategy_api";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export const useGetPeerAnalysisStatus = ({
  strategyId,
  peerId,
  peerType,
  enabled = true,
}: {
  strategyId: string;
  peerId: string;
  peerType: string;
  enabled?: boolean;
}) => {
  const { updateCredits } = useCredits();

  const [shouldPoll, setShouldPoll] = useState(true);
  const [isPollingLoading, setIsPollingLoading] = useState(false);
  const [pollingRestartKey, setPollingRestartKey] = useState(0); // 💡 used to force refetch

  const queryEnabled =
    !!strategyId && !!peerId && !!peerType && enabled && shouldPoll;

  const query = useQuery({
    retry: false,
    queryKey: [
      QUERY_KEYS.STRATEGY,
      strategyId,
      peerId,
      peerType,
      pollingRestartKey, // 🔁 changes when restartPolling is called
    ],
    queryFn: () =>
      getPeerAnalysisStatus({
        id: strategyId,
        peerId,
        peerType,
      }),
    enabled: queryEnabled,
    refetchInterval: (data) => {
      const isReady = data?.state?.data?.is_ready_to_interact === true;

      if (isReady) {
        setShouldPoll(false);
        setIsPollingLoading(false);
        return false;
      }
      return 5000; // keep polling every 5s
    },
  });

  // Set loading state when polling is active
  useEffect(() => {
    if (queryEnabled) {
      setIsPollingLoading(true);
    }
  }, [queryEnabled]);

  // Stop polling and loading on error
  useEffect(() => {
    if (query.isError) {
      setShouldPoll(false);
      setIsPollingLoading(false);
    }
  }, [query.isError]);

  // Update credits when data becomes ready
  useEffect(() => {
    if (query?.data?.is_ready_to_interact) {
      updateCredits({ usedCredits: query?.data?.credits });
    }
  }, [query.data]);

  // 🔁 Restart polling: update key to force React Query to re-run
  const restartPolling = () => {
    setShouldPoll(true);
    setIsPollingLoading(true);
    setPollingRestartKey((prev) => prev + 1); // 👈 force new queryKey
  };

  return {
    ...query,
    restartPolling,
    isPollingLoading,
  };
};
