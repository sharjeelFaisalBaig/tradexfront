import {
  createFolder,
  deleteFolder,
  updateFolderName,
} from "@/services/folder/folder_Mutation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { Folder } from "@/lib/types";

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Folder>) => createFolder(data),
    onSuccess: (newData) => {
      queryClient.setQueryData(
        [QUERY_KEYS.FOLDERS],
        (oldData: { data: { folders: Folder[] } } | undefined) => {
          if (!oldData) {
            return { data: { folders: [newData?.data?.folder] } };
          }

          const newFolder = newData?.data?.folder;

          if (newFolder.parent_folder_id === null) {
            // Root folder - add to root level
            const updatedFolders = [...oldData.data.folders, newFolder];
            return {
              ...oldData,
              data: { ...oldData.data, folders: updatedFolders },
            };
          } else {
            // Nested folder - update parent's children
            const updateFolderTree = (folders: Folder[]): Folder[] => {
              return folders.map((folder) => {
                if (folder.id === newFolder.parent_folder_id) {
                  return {
                    ...folder,
                    children: [...(folder.children || []), newFolder],
                  };
                }
                return {
                  ...folder,
                  children: updateFolderTree(folder.children || []),
                };
              });
            };

            return {
              ...oldData,
              data: {
                ...oldData.data,
                folders: updateFolderTree(oldData.data.folders),
              },
            };
          }
        }
      );
    },
  });
};

export const useRenameFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateFolderName(id, name),
    onSuccess: (newData, variables) => {
      queryClient.setQueryData(
        [QUERY_KEYS.FOLDERS],
        (oldData: { data: { folders: Folder[] } } | undefined) => {
          if (!oldData) return oldData;

          const updateFolderTree = (folders: Folder[]): Folder[] => {
            return folders.map((folder) => {
              if (folder.id === variables.id) {
                return { ...folder, name: variables.name };
              }
              return {
                ...folder,
                children: updateFolderTree(folder.children || []),
              };
            });
          };

          return {
            ...oldData,
            data: {
              ...oldData.data,
              folders: updateFolderTree(oldData.data.folders),
            },
          };
        }
      );
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(
        [QUERY_KEYS.FOLDERS],
        (oldData: { data: { folders: Folder[] } } | undefined) => {
          if (!oldData) return oldData;

          const deleteFolderFromTree = (folders: Folder[]): Folder[] => {
            return folders
              .filter((folder) => folder.id !== deletedId)
              .map((folder) => ({
                ...folder,
                children: deleteFolderFromTree(folder.children || []),
              }));
          };

          return {
            ...oldData,
            data: {
              ...oldData.data,
              folders: deleteFolderFromTree(oldData.data.folders),
            },
          };
        }
      );
    },
  });
};
