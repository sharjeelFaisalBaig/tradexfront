interface Props {
  x: number;
  y: number;
  isBackground: boolean;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onAddFolder?: () => void;
  onRename?: () => void;
  onAddStrategies?: () => void;
}

export default function ContextMenu({
  x,
  y,
  isBackground,
  onDelete,
  onCopy,
  onPaste,
  onAddFolder,
  onRename,
  onAddStrategies,
}: Props) {
  return (
    <ul
      className="absolute z-50 bg-white border border-gray-300 shadow-md rounded overflow-hidden text-sm w-40"
      style={{ top: y, left: x }}
    >
      {isBackground ? (
        <>
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={onAddFolder}
          >
            Add Folder
          </li>
          {onPaste && (
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={onPaste}
            >
              Paste
            </li>
          )}
        </>
      ) : (
        <>
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={onAddFolder}
          >
            Add Folder
          </li>
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={onAddStrategies}
          >
            Add Strategy
          </li>
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={onRename}
          >
            Rename
          </li>
          <li
            className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer"
            onClick={onDelete}
          >
            Delete
          </li>
        </>
      )}
    </ul>
  );
}
