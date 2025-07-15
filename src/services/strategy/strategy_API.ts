import { endpoints } from "@/lib/endpoints";
import axiosInstance from "../axios";

export const getStrategies = async () => {
  const response = await axiosInstance.get(endpoints.STRATEGY.LIST);
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
    endpoints.STRATEGY.CONVERSATION(strategyId)
  );
  return res.data;
};

export const getConversationById = async (
  strategyId: string,
  conversationId: string
) => {
  const res = await axiosInstance.get(
    endpoints.STRATEGY.CONVERSATION_BY_ID(strategyId, conversationId)
  );
  return res.data;
};
