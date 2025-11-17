import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import {
  getStrategyById,
  getStrategies,
  getConversationById,
  getAllConversations,
  getAiModels,
  getChatTemplates,
  getStrategiesTags,
  getRecentStrategies,
  getFavouriteStrategies,
} from "@/services/strategy/strategy_api";

// Hook with search & sort support
export const useGetStrategies = ({
  search = "",
  sort_by = "createdAt",
  sort_order = "desc",
}: {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  return useQuery({
    retry: false,
    queryKey: [QUERY_KEYS.STRATEGIES],
    // queryKey: [QUERY_KEYS.STRATEGIES, { search, sort_by, sort_order }], // params in key
    queryFn: () =>
      getStrategies({
        search,
        sort_by,
        sort_order,
      }),
  });
};

// get recent strategies hook
export const useGetRecentStrategies = ({
  search = "",
  sort_by = "createdAt",
  sort_order = "desc",
}: {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  return useQuery({
    retry: false,
    queryKey: [QUERY_KEYS.RECENT_STRATEGIES],
    queryFn: () =>
      getRecentStrategies({
        search,
        sort_by,
        sort_order,
      }),
  });
};

// get Favourite strategies hook
export const useGetFavouriteStrategies = ({
  search = "",
  sort_by = "createdAt",
  sort_order = "desc",
}: {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  return useQuery({
    retry: false,
    queryKey: [QUERY_KEYS.FAVOURITE_STRATEGIES],
    queryFn: () =>
      getFavouriteStrategies({
        search,
        sort_by,
        sort_order,
      }),
  });
};

export const useGetStrategiesTags = () => {
  return useQuery({
    retry: false,
    queryKey: [QUERY_KEYS.STRATEGIES_TAGS],
    queryFn: getStrategiesTags,
  });
};

export const useGetStrategyById = (id?: string) => {
  return useQuery({
    retry: false,
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

export const useConversationMessages = ({
  strategyId,
  conversationId,
}: {
  strategyId: string;
  conversationId: string;
}) => {
  return useInfiniteQuery({
    queryKey: [
      QUERY_KEYS.CONVERSATION,
      QUERY_KEYS.CHAT,
      conversationId,
      strategyId,
    ],
    queryFn: async ({ pageParam }) => {
      const res = await getConversationById({
        page: pageParam,
        strategyId,
        conversationId,
      });
      return res?.conversation;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage || {};
      if (!pagination) return undefined;

      const hasMore = pagination.current_page < pagination.last_page;
      return hasMore ? pagination.current_page + 1 : undefined;
    },
    initialPageParam: 1, // <-- REQUIRED in v5
    enabled: !!strategyId && !!conversationId,
  });
};
