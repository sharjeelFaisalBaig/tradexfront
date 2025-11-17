"use client";
import { useState, useRef, useEffect } from "react";
import FolderItem from "./FolderItem";
import ContextMenu from "./ContextMenu";
import { useCreateFolder } from "@/hooks/folder/useFolderMutations";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { showAPIErrorToast } from "@/lib/utils";

let folderIdCounter = 1;

export default function FolderExplorer() {
  const successNote = useSuccessNotifier();

  const [folders, setFolders] = useState<
    {
      id: string;
      name: string;
      children: { id: string; name: string; children: any[] }[];
    }[]
  >([{ id: `folder-${folderIdCounter++}`, name: "Root", children: [] }]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    folderId: "",
    isBackground: false,
  });
  const [copiedFolder, setCopiedFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>(
    `folder-${folderIdCounter - 1}`
  ); // Start at Root
  const [folderPath, setFolderPath] = useState<string[]>([
    `folder-${folderIdCounter - 1}`,
  ]); // Track navigation history

  const containerRef = useRef<HTMLDivElement>(null);

  // mutations
  const { mutate: createFolder, isPending: isCreatingFolder } =
    useCreateFolder();

  const handleCreateFolder = async (parentId: string) => {
    const baseName = "New Folder";
    const parentFolder = findFolderById(folders, parentId);
    if (parentFolder) {
      createFolder(
        {
          name: "Third Folder",
          description: "Folder description",
          parent_folder_id: parentId,
        }, // payload
        {
          onSuccess: (data: any) => {
            successNote({
              title: "Folder Created",
              description: `Folder "${data?.data?.name}" created successfully.`,
            });
            // router.push(`/folders/${data?.data?.id}`);
          },
          onError: (error) => {
            showAPIErrorToast(error);
          },
        }
      );
    }
  };

  const generateUniqueFolderName = (
    baseName: string,
    parentChildren: { id: string; name: string; children: any[] }[]
  ) => {
    let newName = baseName;
    let counter = 1;
    while (parentChildren.some((folder) => folder.name === newName)) {
      newName = `${baseName} (${counter++})`;
    }
    return newName;
  };

  const createNewFolder = (parentId: string) => {
    const baseName = "New Folder";
    const parentFolder = findFolderById(folders, parentId);
    if (parentFolder) {
      const newName = generateUniqueFolderName(baseName, parentFolder.children);
      const newId = `folder-${folderIdCounter++}`;
      setFolders((prev) =>
        updateFolderChildren(prev, parentId, [
          ...parentFolder.children,
          { id: newId, name: newName, children: [] },
        ])
      );
      setEditingFolderId(newId);
    }
  };

  const handleRename = (id: string, newName: string) => {
    const trimmedName = newName.trim() || "Untitled Folder";
    const folder = findFolderById(folders, id);
    const parentFolder = folder ? findParentFolder(folders, id) : null;
    if (
      parentFolder &&
      parentFolder.children.some((f) => f.name === trimmedName && f.id !== id)
    ) {
      setDuplicateName(trimmedName);
      setModalOpen(true);
      return;
    }
    setFolders((prev) => updateFolderName(prev, id, trimmedName));
    setEditingFolderId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string = "") => {
    e.preventDefault();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (containerRect?.left || 0);
    const y = e.clientY - (containerRect?.top || 0);

    // console.log("Context Menu Triggered - folderId:", id, "isBackground:", id === "");

    setContextMenu({
      visible: true,
      x,
      y,
      folderId: id,
      isBackground: id === "",
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      folderId: "",
      isBackground: false,
    });
  };

  const handleCopy = (id: string) => {
    const folder = findFolderById(folders, id);
    if (folder) setCopiedFolder({ id: folder.id, name: folder.name });
    handleCloseContextMenu();
  };

  const handlePaste = (parentId: string) => {
    if (copiedFolder) {
      const parentFolder = findFolderById(folders, parentId);
      if (parentFolder) {
        const baseName = copiedFolder.name.includes("- Copy")
          ? copiedFolder.name.replace("- Copy", "")
          : copiedFolder.name;
        const newName = generateUniqueFolderName(
          `${baseName} - Copy`,
          parentFolder.children
        );
        const newId = `folder-${folderIdCounter++}`;
        setFolders((prev) =>
          updateFolderChildren(prev, parentId, [
            ...parentFolder.children,
            { id: newId, name: newName, children: [] },
          ])
        );
      }
    }
    handleCloseContextMenu();
  };

  const handleDelete = (id: string) => {
    const parentFolder = findParentFolder(folders, id);
    if (parentFolder) {
      setFolders((prev) =>
        updateFolderChildren(
          prev,
          parentFolder.id,
          parentFolder.children.filter((f) => f.id !== id)
        )
      );
    }
    handleCloseContextMenu();
  };

  const handleRenameContext = (id: string) => {
    setEditingFolderId(id);
    handleCloseContextMenu();
  };

  const handleModalConfirm = () => {
    setModalOpen(false);
    setDuplicateName("");
    setEditingFolderId(null);
  };

  const handleFolderClick = (id: string) => {
    setFolderPath((prev) => [...prev, id]);
    setCurrentFolderId(id);
  };

  const handleBackClick = () => {
    if (folderPath.length > 1) {
      const newPath = [...folderPath];
      newPath.pop(); // Remove current folder
      setFolderPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1]); // Go to previous folder
    }
  };

  // Handle clicks and key presses to close the context menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu.visible) {
        const menuElement = document.querySelector("ul");
        if (menuElement && !menuElement.contains(e.target as Node)) {
          handleCloseContextMenu();
        }
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (contextMenu.visible && e.key === "Escape") {
        handleCloseContextMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [contextMenu.visible]);

  // Helper functions
  const findFolderById = (
    folders: any[],
    id: string
  ): { id: string; name: string; children: any[] } | null => {
    for (let folder of folders) {
      if (folder.id === id) return folder;
      const found = findFolderById(folder.children, id);
      if (found) return found;
    }
    return null;
  };

  const findParentFolder = (
    folders: any[],
    id: string
  ): { id: string; name: string; children: any[] } | null => {
    for (let folder of folders) {
      if (folder.children.some((f: any) => f.id === id)) return folder;
      const found = findParentFolder(folder.children, id);
      if (found) return found;
    }
    return null;
  };

  const updateFolderChildren = (
    folders: any[],
    id: string,
    newChildren: any[]
  ): any[] => {
    return folders.map((folder) => {
      if (folder.id === id) return { ...folder, children: newChildren };
      return {
        ...folder,
        children: updateFolderChildren(folder.children, id, newChildren),
      };
    });
  };

  const updateFolderName = (
    folders: any[],
    id: string,
    newName: string
  ): any[] => {
    return folders.map((folder) => {
      if (folder.id === id) return { ...folder, name: newName };
      return {
        ...folder,
        children: updateFolderName(folder.children, id, newName),
      };
    });
  };

  const currentFolder = findFolderById(folders, currentFolderId);

  return (
    <div
      className="p-4 relative bg-red-400"
      ref={containerRef}
      onContextMenu={(e) => handleContextMenu(e, currentFolderId)}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold">
            Folders - {currentFolder ? currentFolder.name : "Root"}
          </h2>
        </div>
        <button
          onClick={() => handleCreateFolder(currentFolderId)}
          // onClick={() => createNewFolder(currentFolderId)}
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
        {currentFolder?.children.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            onRename={handleRename}
            onContextMenu={handleContextMenu}
            isEditing={editingFolderId === folder.id}
            onFolderClick={handleFolderClick}
          />
        ))}
      </div>

      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isBackground={contextMenu.isBackground}
          onDelete={() => handleDelete(contextMenu.folderId)}
          onCopy={() => handleCopy(contextMenu.folderId)}
          onPaste={() => handlePaste(currentFolderId)}
          onAddFolder={() => createNewFolder(currentFolderId)}
          onRename={() => handleRenameContext(contextMenu.folderId)}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow-lg">
            <p className="mb-4">
              A folder named "{duplicateName}" already exists. Please choose a
              different name.
            </p>
            <button
              onClick={handleModalConfirm}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
