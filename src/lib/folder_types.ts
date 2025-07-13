export interface Folder {
  id: string;
  name: string;
  description: string;
  parent_folder_id: string | null;
  strategies: IStrategy[];
  children: Folder[];
}

export interface IStrategy {
  id: string;
  name: string;
  description: string;
  tags: string[];
  is_favourite: boolean;
  updated_at: string;
}

export interface FolderCreateParams {
  name: string;
  description?: string;
  parent_folder_id?: string | null;
}

export interface FolderUpdateParams {
  name?: string;
  description?: string;
}

export interface MoveFolderParams {
  parent_folder_id: string | null;
}

export interface ITemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  is_template: boolean;
  author: string;
  image: string;
  updated_at: string;
}