import { QUERY_KEYS } from "@/lib/queryKeys";
import { getStrategies } from "@/services/strategy/strategy_API";
import { useQuery } from "@tanstack/react-query";

export const useGetStrategies = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.STRATEGIES],
    queryFn: getStrategies,
  });
};
