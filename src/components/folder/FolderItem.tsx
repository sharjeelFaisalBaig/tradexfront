import { useState, useEffect, useRef } from "react";

interface Props {
  folder: { id: string; name: string; children: any[] };
  onRename: (id: string, name: string) => void;
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
}: Props) {
  const [name, setName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  useEffect(() => {
    setName(folder.name);
  }, [folder.name]);

  const handleBlur = () => {
    onRename(folder.id, name.trim() || "Untitled Folder");
  };

  const handleDoubleClick = () => {
    onRename(folder.id, folder.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, folder.id);
  };

  const handleClick = () => {
    onFolderClick(folder.id);
  };

  return (
    <div
      className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
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
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="border border-gray-300 rounded px-2 py-0.5 text-sm"
        />
      ) : (
        <span>{name}</span>
      )}
    </div>
  );
}
