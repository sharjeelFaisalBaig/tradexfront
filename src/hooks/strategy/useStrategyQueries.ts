import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import {
  getStrategyById,
  getStrategies,
  getConversationById,
  getAllConversations,
  getAiModels,
  getChatTemplates,
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

export const useGetConversations = (
  strategyId: string,
  { disabled }: { disabled?: boolean }
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, QUERY_KEYS.STRATEGY, strategyId],
    queryFn: () => getAllConversations(strategyId),
    enabled: !!strategyId && !disabled,
  });
};

export const useGetConversationById = ({
  page,
  strategyId,
  conversationId,
}: {
  page: number;
  strategyId: string;
  conversationId: string;
}) => {
  return useQuery({
    queryKey: [
      QUERY_KEYS.CONVERSATION,
      QUERY_KEYS.CHAT,
      conversationId,
      strategyId,
    ],
    queryFn: () => getConversationById({ page, strategyId, conversationId }),
    enabled: !!strategyId && !!conversationId,
  });
};

export const useGetAiModels = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_MODELS],
    queryFn: () => getAiModels(),
  });
};

export const useGetChatTemplates = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_CHAT_TEMPLATES],
    queryFn: () => getChatTemplates(),
  });
};
