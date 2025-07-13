"use client";
import { useState, useRef, useEffect } from "react";
import FolderItem from "./FolderItem";
import ContextMenu from "./ContextMenu";
import { FolderAPI } from "@/services/folder/folder_API";
import { Folder } from "@/lib/folder_types";
import { Session } from "next-auth";

export default function FolderExplorer({ initialFolders, session }: { initialFolders: Folder[], session: Session | null }) {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    folderId: "",
    isBackground: false,
  });
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLUListElement>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [folderPath, setFolderPath] = useState<string[]>(["root"]);

  const containerRef = useRef<HTMLDivElement>(null);

  const reloadFolders = async () => {
    if (session) {
      const folderData = await FolderAPI.listFolders(session, true);
      setFolders(folderData.data.folders);
    }
  };

  const createNewFolder = (parentId: string | null) => {
    const newId = `new-folder-${Date.now()}`;
    const newFolder: Folder = {
      id: newId,
      name: "",
      description: "",
      parent_folder_id: parentId,
      strategies: [],
      children: [],
    };

    const findAndAdd = (nodes: Folder[]): Folder[] => {
      if (parentId === "root" || parentId === null) {
        return [...nodes, newFolder];
      }
      return nodes.map(folder => {
        if (folder.id === parentId) {
          return { ...folder, children: [...(folder.children || []), newFolder] };
        }
        if (folder.children) {
          return { ...folder, children: findAndAdd(folder.children) };
        }
        return folder;
      });
    };

    setFolders(findAndAdd(folders));
    setEditingFolderId(newId);
  };

  const handleRename = async (id: string, newName: string) => {
    const trimmedName = newName.trim() || "Untitled Folder";
    setEditingFolderId(null);

    if (id.startsWith("new-folder-")) {
      const parentId = findParentFolder(folders, id)?.id || "root";
      try {
        await FolderAPI.createFolder(session, { name: trimmedName, parent_folder_id: parentId === "root" ? null : parentId });
        reloadFolders();
      } catch (error) {
        console.error("Failed to create folder:", error);
        // Revert optimistic update
        setFolders(folders.map(f => ({...f, children: f.children.filter(c => c.id !== id)})));
      }
    } else {
      try {
        await FolderAPI.updateFolder(session, id, { name: trimmedName });
        reloadFolders();
      } catch (error) {
        console.error("Failed to rename folder:", error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await FolderAPI.deleteFolder(session, id);
      reloadFolders();
    } catch (error) {
      console.error("Failed to delete folder:", error);
    }
    handleCloseContextMenu();
  };

  const handleContextMenu = (e: React.MouseEvent, id: string = "") => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFolderId(id);
    const containerRect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (containerRect?.left || 0);
    const y = e.clientY - (containerRect?.top || 0);

    setContextMenu({
      visible: true,
      x,
      y,
      folderId: id,
      isBackground: id === "",
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, folderId: "", isBackground: false });
  };

  const handleRenameContext = (id: string) => {
    setEditingFolderId(id);
    handleCloseContextMenu();
  };

  const handleFolderClick = (id: string) => {
    if (id !== editingFolderId) {
      setFolderPath((prev) => [...prev, id]);
      setCurrentFolderId(id);
    }
  };

  const handleBackClick = () => {
    if (folderPath.length > 1) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        handleCloseContextMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu.visible]);

  const findFolderById = (nodes: Folder[], id: string): Folder | null => {
    if (id === "root") return { id: "root", name: "Root", description: "", parent_folder_id: null, strategies: [], children: folders };
    for (const folder of nodes) {
      if (folder.id === id) return folder;
      if (folder.children) {
        const found = findFolderById(folder.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const findParentFolder = (nodes: Folder[], id: string): Folder | null => {
    for (const folder of nodes) {
      if (folder.children?.some(child => child.id === id)) {
        return folder;
      }
      if (folder.children) {
        const found = findParentFolder(folder.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const currentFolder = findFolderById(folders, currentFolderId);

  return (
    <div className="p-4 relative" ref={containerRef} onContextMenu={(e) => handleContextMenu(e, currentFolderId)}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold">Folders - {currentFolder ? currentFolder.name : "Root"}</h2>
        </div>
        <button
          onClick={() => createNewFolder(currentFolderId === "root" ? null : currentFolderId)}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          + Create Folder
        </button>
      </div>
      {folderPath.length > 1 && (
        <button
          onClick={handleBackClick}
          className="bg-gray-300 text-black px-2 py-1 rounded mb-2 hover:bg-gray-400"
        >
          Back
        </button>
      )}

      <div className="space-y-1">
        {currentFolder?.children?.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            onRename={handleRename}
            onContextMenu={handleContextMenu}
            isEditing={editingFolderId === folder.id}
            isSelected={contextMenu.visible && contextMenu.folderId === folder.id}
            onFolderClick={handleFolderClick}
          />
        ))}
      </div>

      {contextMenu.visible && (
        <ContextMenu
          ref={contextMenuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          isBackground={contextMenu.isBackground}
          onDelete={() => handleDelete(contextMenu.folderId)}
          onCopy={() => {
            // Implement copy functionality if needed
            handleCloseContextMenu();
          }}
          onPaste={() => {
            // Implement paste functionality if needed
            handleCloseContextMenu();
          }}
          onAddFolder={() => createNewFolder(currentFolderId === "root" ? null : currentFolderId)}
          onRename={() => handleRenameContext(contextMenu.folderId)}
        />
      )}
    </div>
  );
}