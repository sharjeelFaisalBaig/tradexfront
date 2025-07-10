"use client";

import type React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNodeOperations } from "../../hooks/useNodeOperations";

interface NodeWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

export default function NodeWrapper({
  id,
  children,
  className = "",
  showDeleteButton = true,
  onDelete,
}: NodeWrapperProps) {
  const { deleteNode } = useNodeOperations();

  // Handle delete
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    } else {
      deleteNode(id);
    }
  };

  // If delete button is disabled, return children without delete button
  if (!showDeleteButton) {
    return children;
  }

  return (
    <div className={cn("relative group", className)}>
      {children}

      {/* Delete button in top-left corner */}
      <button
        onClick={handleDelete}
        className="absolute -top-3.5 -left-3.5 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-100 z-10 shadow-md"
        title="Delete Node"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
