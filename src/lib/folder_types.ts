export interface Folder {
  id: string;
  name: string;
  description: string;
  parent_id: number | null;
  strategies: IStrategy[];
  children: Folder[];
}

export interface FolderCreateParams {
  name: string;
  description?: string;
  parent_id?: number | null;
}

export interface FolderUpdateParams {
  name?: string;
  description?: string;
}

export interface MoveFolderParams {
  parent_id: number | null;
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

export interface IStrategy {
  id: string;
  name: string;
  description: string;
  tags: string[];
  is_favourite: boolean;
  updated_at: string;
}