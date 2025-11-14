import { endpoints } from "@/lib/endpoints";
import { Folder } from "@/lib/types";
import axiosInstance from "../axios";

export const createFolder = async (data: Partial<Folder>) => {
  const res = await axiosInstance.post(endpoints.FOLDER.CREATE, data);
  return res.data;
};
