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

// export const getStrategies = async (session: Session | null) => {
//   return fetchWithAutoRefresh(endpoints.STRATEGY.LIST, session);
// };

// export const getStrategy = async (id: string, session: Session | null) => {
//   return fetchWithAutoRefresh(endpoints.STRATEGY.GET(id), session);
// };
