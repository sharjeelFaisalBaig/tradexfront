import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { searchUsers } from "@/services/invitation/invitation_api";

export const useSearchUsers = (searchText: string) => {
  return useQuery({
    enabled: searchText.length > 2, // only search after 3 chars
    retry: false,
    queryKey: [QUERY_KEYS.SEARCH_USERS, searchText],
    queryFn: ({ queryKey }) => searchUsers(queryKey[1] as string),
  });
};
