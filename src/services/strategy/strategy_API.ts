import { endpoints } from "@/lib/endpoints";
import axiosInstance from "../axios";

export const getStrategies = async ({
  search,
  sort_by,
  sort_order,
}: {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  const response = await axiosInstance.get(endpoints.STRATEGY.LIST, {
    params: {
      search,
      sort_by,
      sort_order,
      per_page: -1, // fetch all strategies without pagination
    },
  });
  return response.data;
};

export const getRecentStrategies = async ({
  search,
  sort_by,
  sort_order,
}: {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  const response = await axiosInstance.get(endpoints.STRATEGY.RECENTS, {
    params: {
      search,
      sort_by,
      sort_order,
      per_page: -1, // fetch all strategies without pagination
    },
  });
  return response.data;
};

export const getFavouriteStrategies = async ({
  search,
  sort_by,
  sort_order,
}: {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  const response = await axiosInstance.get(endpoints.STRATEGY.FAVOURITES, {
    params: {
      search,
      sort_by,
      sort_order,
      per_page: -1, // fetch all strategies without pagination
    },
  });
  return response.data;
};

export const getSharedStrategies = async ({
  search,
  sort_by,
  sort_order,
}: {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  const response = await axiosInstance.get(
    endpoints.INVITATION.GET_SHARED_WITH_ME,
    {
      params: {
        search,
        sort_by,
        sort_order,
        per_page: -1, // fetch all strategies without pagination
      },
    }
  );
  return response.data;
};

export const getStrategiesTags = async () => {
  const response = await axiosInstance.get(endpoints.STRATEGY.TAGS);
  return response.data;
};

export const getStrategyById = async (id: string) => {
  const response = await axiosInstance.get(endpoints.STRATEGY.GET(id));
  return response.data;
};

export const getPeerAnalysisStatus = async ({
  id,
  peerId,
  peerType,
}: {
  id: string;
  peerId: string;
  peerType: string;
}) => {
  const res = await axiosInstance.get(
    endpoints.STRATEGY.GET_PEER_ANALYSIS_STATUS({ id, peerId, peerType })
  );
  return res.data;
};

export const getAllConversations = async (strategyId: string) => {
  const res = await axiosInstance.get(
    endpoints.STRATEGY.CONVERSATIONS(strategyId)
  );
  return res.data;
};

export const getConversationById = async ({
  page,
  strategyId,
  conversationId,
}: {
  page: number;
  strategyId: string;
  conversationId: string;
}) => {
  const res = await axiosInstance.get(
    endpoints.STRATEGY.CONVERSATION_BY_ID({
      page,
      id: strategyId,
      conversationId,
    })
  );
  return res.data;
};

export const getAiModels = async () => {
  const res = await axiosInstance.get(endpoints.CHAT_BOX.GET_AI_MODELS);
  return res.data;
};

export const getChatTemplates = async () => {
  const res = await axiosInstance.get(endpoints.CHAT_BOX.GET_CHAT_TEMPLATES);
  return res.data;
};
