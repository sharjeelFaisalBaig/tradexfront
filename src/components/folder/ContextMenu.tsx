import { forwardRef } from 'react';

interface Props {
  x: number;
  y: number;
  isBackground: boolean;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onAddFolder?: () => void;
  onRename?: () => void;
}

const ContextMenu = forwardRef<HTMLUListElement, Props>(
  ({ x, y, isBackground, onDelete, onCopy, onPaste, onAddFolder, onRename }, ref) => {
    return (
      <ul
        ref={ref}
        className="absolute z-50 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-md rounded text-sm w-40 text-gray-900 dark:text-gray-200"
        style={{ top: y, left: x }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isBackground ? (
          <>
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={onAddFolder}
            >
              Add Folder
            </li>
            {onPaste && (
              <li
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={onPaste}
              >
                Paste
              </li>
            )}
          </>
        ) : (
          <>
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={onRename}
            >
              Rename
            </li>
            <li
              className="px-4 py-2 hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-400 cursor-pointer"
              onClick={onDelete}
            >
              Delete
            </li>
          </>
        )}
      </ul>
    );
  }
);

export default ContextMenu;