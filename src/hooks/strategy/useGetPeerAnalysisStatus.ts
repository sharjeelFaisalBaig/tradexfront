import { useCredits } from "@/context/CreditContext";
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
  const { updateCredits } = useCredits();
  const [shouldPoll, setShouldPoll] = useState(true);
  const [isPollingLoading, setIsPollingLoading] = useState(false);

  const query = useQuery({
    retry: false,
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
        updateCredits({ usedCredits: data?.state?.data?.credits });
        return false;
      }
      return 5000;
    },
  });

  useEffect(() => {
    if (!!strategyId && !!peerId && !!peerType && enabled && shouldPoll) {
      setIsPollingLoading(true);
    }
  }, [strategyId, peerId, peerType, enabled, shouldPoll]);

  useEffect(() => {
    if (query.isError) {
      setShouldPoll(() => false);
      setIsPollingLoading(() => false);
    }
  }, [query.isError]);

  // useEffect(() => {
  //   if (!shouldPoll) {
  //     setIsPollingLoading(false);
  //   }
  // }, [shouldPoll]);

  return {
    ...query,
    restartPolling: () => {
      setShouldPoll(() => true);
      setIsPollingLoading(() => true);
    },
    isPollingLoading,
  };
};
