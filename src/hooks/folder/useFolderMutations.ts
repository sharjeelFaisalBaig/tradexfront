import { Folder } from "@/lib/types";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { createFolder } from "@/services/folder/folder_Mutation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Folder>) => createFolder(data),
    onSuccess: (newFolder) => {
      queryClient.setQueryData(
        [QUERY_KEYS.FOLDERS],
        (oldData: { data: { folders: Folder[] } } | undefined) => {
          if (!oldData) {
            return { data: { folders: [newFolder.data] } };
          }

          const updatedFolders = [newFolder.data, ...oldData.data.folders];

          return {
            ...oldData,
            data: { ...oldData.data, folders: updatedFolders },
          };
        }
      );
    },
  });
};
