import { endpoints } from "@/lib/endpoints";
import { IStrategy } from "@/lib/types";
import axiosInstance from "../axios";

export const createStrategy = async (data: Partial<IStrategy>) => {
  const res = await axiosInstance.post(endpoints.STRATEGY.CREATE, data);
  return res.data;
};

export const updateStrategy = async (id: string, data: Partial<IStrategy>) => {
  const res = await axiosInstance.put(endpoints.STRATEGY.UPDATE(id), data);
  return res.data;
};

export const copyStrategy = async (id: string) => {
  const res = await axiosInstance.post(endpoints.STRATEGY.COPY(id));
  return res.data;
};

export const toggleStrategy = async (id: string, is_active: boolean) => {
  const res = await axiosInstance.put(endpoints.STRATEGY.TOGGLE(id), {
    is_active,
  });
  return res.data;
};

export const favouriteStrategy = async (id: string, is_favourite: boolean) => {
  const res = await axiosInstance.put(endpoints.STRATEGY.FAVOURITE(id), {
    is_favourite,
  });
  return res.data;
};
