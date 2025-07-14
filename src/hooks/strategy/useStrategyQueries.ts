import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import {
  getStrategyById,
  getStrategies,
  getPeerAnalysisStatus,
} from "@/services/strategy/strategy_API";

export const useGetStrategies = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.STRATEGIES],
    queryFn: getStrategies,
  });
};

export const useGetStrategyById = (id?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.STRATEGY, id],
    queryFn: () => {
      if (!id) throw new Error("Strategy ID is required");
      return getStrategyById(id);
    },
    enabled: !!id, // run only if id is defined
  });
};

export const useGetPeerAnalysisStatus = ({
  strategyId,
  peerId,
  peerType,
  enabled = true, // 👈 default is true so older code doesn’t break
}: {
  strategyId: string;
  peerId: string;
  peerType: string;
  enabled?: boolean; // 👈 add this optional flag
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.STRATEGY, strategyId, peerId, peerType],
    queryFn: () =>
      getPeerAnalysisStatus({
        id: strategyId,
        peerId,
        peerType,
      }),
    enabled: !!strategyId && !!peerId && !!peerType && enabled, // 👈 ensure all required params are present
    refetchInterval: (data) => {
      return data?.state?.data?.is_ready_to_interact === true ? false : 5000; // 👈 conditional refetch logic
    },
  });
};
