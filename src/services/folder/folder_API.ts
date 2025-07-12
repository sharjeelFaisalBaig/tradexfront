import { fetchWithAutoRefresh } from '@/lib/fetchWithAutoRefresh';
import { endpoints } from '@/lib/endpoints';
import { Folder, FolderCreateParams, FolderUpdateParams, MoveFolderParams } from '@/lib/folder_types';
import { Session } from 'next-auth';

export const FolderAPI = {
  listFolders: async (session: Session | null, tree: boolean = false): Promise<any> => {
    return fetchWithAutoRefresh(`${endpoints.FOLDER.LIST}?tree=${tree}`, session, {
      method: 'GET',
    });
  },

  createFolder: async (session: Session | null, data: FolderCreateParams): Promise<Folder> => {
    return fetchWithAutoRefresh(endpoints.FOLDER.CREATE, session, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getFolderDetails: async (session: Session | null, folderId: string): Promise<Folder> => {
    return fetchWithAutoRefresh(endpoints.FOLDER.GET(folderId), session, {
      method: 'GET',
    });
  },

  updateFolder: async (session: Session | null, folderId: string, data: FolderUpdateParams): Promise<Folder> => {
    return fetchWithAutoRefresh(endpoints.FOLDER.UPDATE(folderId), session, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  moveFolder: async (session: Session | null, folderId: string, data: MoveFolderParams): Promise<void> => {
    await fetchWithAutoRefresh(endpoints.FOLDER.MOVE(folderId), session, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteFolder: async (session: Session | null, folderId: string, action: string = 'move_to_root'): Promise<void> => {
    await fetchWithAutoRefresh(endpoints.FOLDER.DELETE(folderId), session, {
      method: 'DELETE',
      body: JSON.stringify({ action }),
    });
  },

  getStrategiesInFolder: async (session: Session | null, folderId: string): Promise<any[]> => {
    return fetchWithAutoRefresh(endpoints.FOLDER.GET_STRATEGIES(folderId), session, {
      method: 'GET',
    });
  },

  moveStrategyToFolder: async (session: Session | null, strategyId: string, folderId: string): Promise<void> => {
    await fetchWithAutoRefresh(endpoints.STRATEGY.MOVE_TO_FOLDER(strategyId), session, {
      method: 'PATCH',
      body: JSON.stringify({ folder_id: folderId }),
    });
  },
};