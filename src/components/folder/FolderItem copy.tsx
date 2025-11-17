"use client";
import { useState } from "react";
import { Folder } from "@/lib/types";
import { useRenameFolder } from "@/hooks/folder/useFolderMutations";
import { showAPIErrorToast } from "@/lib/utils";

interface FolderItemProps {
  folder: Folder;
  onRename: (id: string, newName: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  isEditing: boolean;
  onFolderClick: (id: string) => void;
}

export default function FolderItem({
  folder,
  onRename,
  onContextMenu,
  isEditing,
  onFolderClick,
}: FolderItemProps) {
  const [editingName, setEditingName] = useState(folder.name);
  const { mutate: renameFolder, isPending: isRenaming } = useRenameFolder();

  const handleRenameSave = () => {
    const trimmedName = editingName.trim() || folder.name;
    if (trimmedName !== folder.name) {
      renameFolder(
        { id: folder.id, name: trimmedName },
        {
          onSuccess: () => {
            onRename(folder.id, trimmedName);
          },
          onError: (err) => {
            showAPIErrorToast(err);
            setEditingName(folder.name);
          },
        }
      );
    } else {
      onRename(folder.id, folder.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSave();
    } else if (e.key === "Escape") {
      setEditingName(folder.name);
      onRename(folder.id, folder.name);
    }
  };

  return (
    <div
      className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer group"
      onContextMenu={(e) => onContextMenu(e, folder.id)}
    >
      <span>
        <svg
          width="22"
          height="18"
          viewBox="0 0 22 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 17V3C1 1.89543 1.89543 1 3 1H6.17157C6.70201 1 7.21071 1.21071 7.58579 1.58579L8.41421 2.41421C8.78929 2.78929 9.29799 3 9.82843 3H17C18.1046 3 19 3.89543 19 5V7M1.09655 16.6782L3.57241 8.4253C3.8262 7.57934 4.60484 7 5.48806 7H18.4384C19.7396 7 20.6943 8.22278 20.3787 9.48507L18.8787 15.4851C18.6561 16.3754 17.8562 17 16.9384 17H1.33601C1.16854 17 1.04843 16.8386 1.09655 16.6782Z"
            stroke="#0088CC"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {isEditing ? (
        <input
          type="text"
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onBlur={handleRenameSave}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={isRenaming}
          className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none"
        />
      ) : (
        <span
          onClick={() => onFolderClick(folder.id)}
          className="flex-1 hover:text-blue-600"
        >
          {folder.name}
        </span>
      )}

      <span className="text-gray-400 text-sm group-hover:visible invisible">
        {folder.children?.length || 0} items
      </span>
    </div>
  );
}
