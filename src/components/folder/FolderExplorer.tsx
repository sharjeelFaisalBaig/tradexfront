"use client";
import { useState, useRef, useEffect } from "react";
import ContextMenu from "./ContextMenu";
import FolderItem from "./FolderItem";
import {
  useCreateFolder,
  useDeleteFolder,
  useRenameFolder,
} from "@/hooks/folder/useFolderMutations";
import { useGetFolders } from "@/hooks/folder/useFolderQueries";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { showAPIErrorToast } from "@/lib/utils";
import { Folder } from "@/lib/types";
import SelectStrategiesModal from "../modal/SelectStrategiesModal";

export default function FolderExplorer() {
  const successNote = useSuccessNotifier();
  const { data, isLoading } = useGetFolders();

  const [folders, setFolders] = useState<Folder[]>([]);

  const [deletingId, setDeletingId] = useState<string>("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<(string | null)[]>([null]);

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
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showStrategiesModal, setShowStrategiesModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const { mutate: createFolder, isPending: isCreatingFolder } =
    useCreateFolder();
  const { mutate: deleteFolder } = useDeleteFolder();
  const { mutate: renameFolder, isPending: isRenaming } = useRenameFolder();

  useEffect(() => {
    if (data?.data?.folders) {
      setFolders(data.data.folders);
    }
  }, [data]);

  const handleCreateFolder = (parentId: string | null) => {
    const parentFolder = parentId ? findFolderById(folders, parentId) : null;
    const children = parentFolder?.children || [];

    const tempName = generateUniqueFolderName("New Folder", children);

    createFolder(
      {
        name: tempName,
        description: "",
        parent_folder_id: parentId, // null for root, folder id for nested
      },
      {
        onSuccess: (res: any) => {
          const newFolder = res.data;

          setFolders((prev) =>
            updateFolderChildren(prev, parentId, [...children, newFolder])
          );

          setEditingFolderId(newFolder.id);
          successNote({
            title: "Folder Created",
            description: newFolder.name,
          });
        },
        onError: (err) => showAPIErrorToast(err),
      }
    );
  };

  const handleRename = (id: string, newName: string) => {
    const trimmedName = newName.trim() || "Untitled Folder";

    const folder = findFolderById(folders, id);
    if (!folder) return;

    const parentFolder = findParentFolder(folders, id);
    const siblings = parentFolder ? parentFolder.children : rootFolders;

    // DUPLICATE CHECK
    if (siblings?.some((f) => f.name === trimmedName && f.id !== id)) {
      setDuplicateName(trimmedName);
      setModalOpen(true);
      return;
    }

    // Optimistic UI update
    setFolders((prev) => updateFolderName(prev, id, trimmedName));

    // Call backend
    renameFolder(
      { id, name: trimmedName },
      {
        onSuccess: () => {
          successNote({
            title: "Folder Renamed",
            description: `Renamed to "${trimmedName}"`,
          });
          setEditingFolderId(null);
        },
        onError: (error) => {
          showAPIErrorToast(error);

          // Undo UI change if API failed
          setFolders((prev) => updateFolderName(prev, id, folder.name));
          setEditingFolderId(null);
        },
      }
    );
  };

  const handleAddStrategies = (folderId: string) => {
    // Implement the logic to add strategies to the folder with the given folderId
    console.log("Add strategies to folder:", folderId);
    setShowStrategiesModal(true);
    setSelectedFolder(findFolderById(folders, folderId));
  };

  const generateUniqueFolderName = (
    baseName: string,
    parentChildren: Folder[]
  ) => {
    let newName = baseName;
    let counter = 1;
    while (parentChildren.some((folder) => folder.name === newName)) {
      newName = `${baseName} (${counter++})`;
    }
    return newName;
  };

  const handleContextMenu = (e: React.MouseEvent, id: string = "") => {
    e.preventDefault();
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

  const handlePaste = (parentId: string | null) => {
    if (copiedFolder) {
      const parentFolder = parentId ? findFolderById(folders, parentId) : null;
      const children = parentFolder?.children || [];

      const baseName = copiedFolder.name.includes("- Copy")
        ? copiedFolder.name.replace("- Copy", "").trim()
        : copiedFolder.name;

      const newName = generateUniqueFolderName(`${baseName} - Copy`, children);

      // TODO: Implement paste via API if needed
      // For now, just update local state or call API to create copy
    }
    handleCloseContextMenu();
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);

    deleteFolder(id, {
      onSuccess: () => {
        successNote({
          title: "Folder Deleted",
          description: "Folder has been deleted successfully",
        });
        setDeletingId("");
      },
      onError: (err) => {
        showAPIErrorToast(err);
        setDeletingId("");
      },
    });
    handleCloseContextMenu();
  };

  const handleRenameContext = (id: string) => {
    console.log({ handleRenameContext: id });

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
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1]);
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
  const findFolderById = (items: Folder[], id: string): Folder | null => {
    if (!Array.isArray(items)) return null;

    for (let f of items) {
      if (f.id === id) return f;
      const found = findFolderById(f?.children || [], id);
      if (found) return found;
    }
    return null;
  };

  const findParentFolder = (items: Folder[], id: string): Folder | null => {
    for (let folder of items) {
      if (folder.children?.some((f) => f.id === id)) return folder;
      const found = findParentFolder(folder.children || [], id);
      if (found) return found;
    }
    return null;
  };

  const updateFolderChildren = (
    list: Folder[],
    id: string | null,
    newChildren: Folder[]
  ): Folder[] => {
    if (id === null) {
      return newChildren;
    }

    return list.map((folder) => {
      if (folder.id === id) {
        return { ...folder, children: newChildren };
      }

      return {
        ...folder,
        children: updateFolderChildren(folder.children || [], id, newChildren),
      };
    });
  };

  const updateFolderName = (
    items: Folder[],
    id: string,
    newName: string
  ): Folder[] => {
    return items.map((folder) => {
      if (folder.id === id) return { ...folder, name: newName };
      return {
        ...folder,
        children: updateFolderName(folder.children || [], id, newName),
      };
    });
  };

  const isRoot = currentFolderId === null;
  const rootFolders = folders.filter((f) => f.parent_folder_id === null);
  const currentFolder = isRoot
    ? null
    : findFolderById(folders, currentFolderId);
  const foldersToDisplay = isRoot ? rootFolders : currentFolder?.children || [];

  return (
    <div
      className="p-4 relative"
      ref={containerRef}
      onContextMenu={(e) => handleContextMenu(e, "")}
    >
      <SelectStrategiesModal
        selectedFolder={selectedFolder}
        isOpen={showStrategiesModal}
        onClose={() => setShowStrategiesModal(false)}
      />

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold">
            Folders - {currentFolder ? currentFolder.name : "Root"}
          </h2>
        </div>
        <button
          onClick={() => handleCreateFolder(currentFolderId)}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
          disabled={isCreatingFolder}
        >
          {isCreatingFolder ? "Creating..." : "+ Create Folder"}
        </button>
      </div>

      {!isRoot && (
        <button
          onClick={handleBackClick}
          className="bg-gray-300 text-black px-2 py-1 rounded mb-2 hover:bg-gray-400"
        >
          ← Back
        </button>
      )}

      <div className="space-y-1">
        {isLoading ? (
          <p className="text-gray-500">Loading folders...</p>
        ) : foldersToDisplay.length === 0 ? (
          <p className="text-gray-500">No folders yet</p>
        ) : (
          foldersToDisplay.map((folder) => (
            <FolderItem
              isDeleting={deletingId === folder.id}
              key={folder.id}
              folder={folder}
              onRename={handleRename}
              onContextMenu={handleContextMenu}
              isEditing={editingFolderId === folder.id}
              onFolderClick={handleFolderClick}
            />
          ))
        )}
      </div>

      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isBackground={contextMenu.isBackground}
          onDelete={() => handleDelete(contextMenu.folderId)}
          onCopy={() => handleCopy(contextMenu.folderId)}
          onPaste={() => handlePaste(currentFolderId)}
          onAddFolder={() => handleCreateFolder(currentFolderId)}
          onRename={() => handleRenameContext(contextMenu.folderId)}
          onAddStrategies={() => handleAddStrategies(contextMenu.folderId)}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
