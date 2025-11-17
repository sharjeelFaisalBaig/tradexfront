import { endpoints } from "@/lib/endpoints";
import { Folder } from "@/lib/types";
import axiosInstance from "../axios";

export const createFolder = async (data: Partial<Folder>) => {
  const res = await axiosInstance.post(endpoints.FOLDER.CREATE, data);
  return res.data;
};

export const updateFolderName = async (id: string, name: string) => {
  const res = await axiosInstance.put(endpoints.FOLDER.UPDATE(id), { name });
  return res.data;
};

export const deleteFolder = async (id: string) => {
  const res = await axiosInstance.delete(endpoints.FOLDER.DELETE(id), {
    data: { action: "delete_all" },
  });
  return res.data;
};

export const moveStrategyToFolder = async ({
  strategyId,
  folder_id,
}: {
  strategyId: string;
  folder_id: string;
}) => {
  const res = await axiosInstance.patch(
    endpoints.FOLDER.MOVE_STRATEGY(strategyId),
    { folder_id }
  );
  return res.data;
};
