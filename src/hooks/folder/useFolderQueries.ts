import { getFoldersList } from "@/services/folder/folder_API";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useGetFolders = () => {
  return useQuery({
    retry: false,
    queryKey: [QUERY_KEYS.FOLDERS],
    queryFn: () => getFoldersList(),
  });
};
