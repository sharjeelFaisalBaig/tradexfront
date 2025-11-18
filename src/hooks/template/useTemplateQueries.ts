import { getTemplatesList } from "@/services/template/template_api";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

export const useGetTemplates = ({
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
    queryKey: [QUERY_KEYS.TEMPLATES],
    // queryKey: [QUERY_KEYS.TEMPLATES, { search, sort_by, sort_order }], // params in key
    queryFn: () =>
      getTemplatesList({
        search,
        sort_by,
        sort_order,
      }),
  });
};
