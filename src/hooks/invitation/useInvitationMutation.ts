import { inviteUsers } from "@/services/invitation/invitation_mutation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { Folder } from "@/lib/types";

export const useInviteUsers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { strategyId: string; emails: string[] }) =>
      inviteUsers(data),
    onSuccess: (newData) => {
      queryClient.setQueryData(
        [QUERY_KEYS.FOLDERS],
        (oldData: { data: { folders: Folder[] } } | undefined) => {
          if (!oldData) {
            return { data: { folders: [newData?.data?.folder] } };
          }

          const newFolder = newData?.data?.folder;

          //   if (newFolder.parent_folder_id === null) {
          //     // Root folder - add to root level
          //     const updatedFolders = [...oldData.data.folders, newFolder];
          //     return {
          //       ...oldData,
          //       data: { ...oldData.data, folders: updatedFolders },
          //     };
          //   } else {
          //     // Nested folder - update parent's children
          //     const updateFolderTree = (folders: Folder[]): Folder[] => {
          //       return folders.map((folder) => {
          //         if (folder.id === newFolder.parent_folder_id) {
          //           return {
          //             ...folder,
          //             children: [...(folder.children || []), newFolder],
          //           };
          //         }
          //         return {
          //           ...folder,
          //           children: updateFolderTree(folder.children || []),
          //         };
          //       });
          //     };

          //     return {
          //       ...oldData,
          //       data: {
          //         ...oldData.data,
          //         folders: updateFolderTree(oldData.data.folders),
          //       },
          //     };
          //   }
        }
      );
    },
  });
};
