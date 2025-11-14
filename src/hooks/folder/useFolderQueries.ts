import { getFoldersList } from "@/services/folder/folder_API";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useGetFolders = ({
  search = "",
  sort_by = "createdAt",
  sort_order = "desc",
}: {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  return useQuery({
    retry: false,
    queryKey: [QUERY_KEYS.FOLDERS],
    // queryKey: [QUERY_KEYS.FOLDERS, { search, sort_by, sort_order }], // params in key
    queryFn: () =>
      getFoldersList({
        search,
        sort_by,
        sort_order,
      }),
  });
};
