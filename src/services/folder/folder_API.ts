import { endpoints } from "@/lib/endpoints";
import axiosInstance from "../axios";

export const getFoldersList = async () => {
  const response = await axiosInstance.get(endpoints.FOLDER.LIST);
  return response.data;
};
