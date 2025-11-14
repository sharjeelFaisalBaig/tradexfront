import { endpoints } from "@/lib/endpoints";
import axiosInstance from "../axios";

export const getFoldersList = async ({
  search,
  sort_by,
  sort_order,
}: {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  const response = await axiosInstance.get(endpoints.FOLDER.LIST, {
    params: {
      search,
      sort_by,
      sort_order,
      per_page: -1, // fetch all strategies without pagination
    },
  });
  return response.data;
};
