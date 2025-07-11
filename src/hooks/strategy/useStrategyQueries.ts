import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import {
  getStrategyById,
  getStrategies,
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
