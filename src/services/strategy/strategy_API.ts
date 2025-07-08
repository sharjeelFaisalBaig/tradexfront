import { endpoints } from "@/lib/endpoints";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { Session } from "next-auth";

export const getStrategies = async (session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.LIST, session);
};

export const getStrategy = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.GET(id), session);
};