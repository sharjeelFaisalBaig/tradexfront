import { getFoldersList } from "@/services/folder/folder_api";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

export const useGetFolders = () => {
  return useQuery({
    retry: false,
    queryKey: [QUERY_KEYS.FOLDERS],
    queryFn: () => getFoldersList(),
  });
};
