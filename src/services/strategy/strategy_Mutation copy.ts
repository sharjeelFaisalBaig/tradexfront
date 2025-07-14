import { endpoints } from "@/lib/endpoints";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { IStrategy } from "@/lib/types";
import { Session } from "next-auth";

export const createStrategy = async (
  data: Partial<IStrategy>,
  session: Session | null
) => {
  return fetchWithAutoRefresh(endpoints.STRATEGY.CREATE, session, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateStrategy = async (
  id: string,
  data: Partial<IStrategy>,
  session: Session | null
) => {
  return fetchWithAutoRefresh(endpoints.STRATEGY.UPDATE(id), session, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const copyStrategy = async (id: string, session: Session | null) => {
  return fetchWithAutoRefresh(endpoints.STRATEGY.COPY(id), session, {
    method: "POST",
  });
};

export const toggleStrategy = async (
  id: string,
  is_active: boolean,
  session: Session | null
) => {
  return fetchWithAutoRefresh(endpoints.STRATEGY.TOGGLE(id), session, {
    method: "PUT",
    body: JSON.stringify({ is_active }),
  });
};

export const favouriteStrategy = async (
  id: string,
  is_favourite: boolean,
  session: Session | null
) => {
  return fetchWithAutoRefresh(endpoints.STRATEGY.FAVOURITE(id), session, {
    method: "PUT",
    body: JSON.stringify({ is_favourite }),
  });
};
