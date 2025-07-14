import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { endpoints } from "@/lib/endpoints";
import { Session } from "next-auth";
import axiosInstance from "../axios";

export const getStrategies = async () => {
  const response = await axiosInstance.get("/strategies");
  return response.data;
};

export const getStrategyById = async (id: string) => {
  const response = await axiosInstance.get(`/strategies/${id}`);
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

// export const getStrategies = async (session: Session | null) => {
//   return fetchWithAutoRefresh(endpoints.STRATEGY.LIST, session);
// };

// export const getStrategy = async (id: string, session: Session | null) => {
//   return fetchWithAutoRefresh(endpoints.STRATEGY.GET(id), session);
// };
