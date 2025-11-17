import { endpoints } from "@/lib/endpoints";
import axiosInstance from "../axios";

export const searchUsers = async (query: string) => {
  const response = await axiosInstance.get(endpoints.INVITATION.SEARCH_USER, {
    params: { query },
  });
  return response.data;
};
