import { QUERY_KEYS } from "@/lib/queryKeys";
import { getPeerAnalysisStatus } from "@/services/strategy/strategy_API";
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
  const [shouldPoll, setShouldPoll] = useState(true);
  const [isPollingLoading, setIsPollingLoading] = useState(false);

  const query = useQuery({
    retry: false, // ❌ disables auto retry
    queryKey: [QUERY_KEYS.STRATEGY, strategyId, peerId, peerType],
    queryFn: () =>
      getPeerAnalysisStatus({
        id: strategyId,
        peerId,
        peerType,
      }),
    enabled: !!strategyId && !!peerId && !!peerType && enabled && shouldPoll,
    refetchInterval: (data) => {
      const isReady = data?.state?.data?.is_ready_to_interact === true;

      if (isReady) {
        setShouldPoll(false);
        setIsPollingLoading(false);
      }

      return isReady ? false : 5000;
    },
  });

  // Set isPollingLoading true when request is triggered
  useEffect(() => {
    if (!!strategyId && !!peerId && !!peerType && enabled && shouldPoll) {
      setIsPollingLoading(true);
    }
  }, [strategyId, peerId, peerType, enabled, shouldPoll]);

  // Stop polling on error
  useEffect(() => {
    if (query.isError) {
      setShouldPoll(false);
    }
  }, [query.isError]);

  // Set isPollingLoading = false only after polling stops
  useEffect(() => {
    if (!shouldPoll) {
      setIsPollingLoading(false);
    }
  }, [shouldPoll]);

  return {
    ...query,
    isPollingLoading, // 👈 custom loading flag during polling
  };
};
