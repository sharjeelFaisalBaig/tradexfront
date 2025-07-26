"use client";

import { Button } from "@/components/ui/button";
import { Undo2, Redo2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface UndoRedoControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const UndoRedoControls = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: UndoRedoControlsProps) => {
  return (
    <TooltipProvider>
      <div className="flex flex-col">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="react-flow__controls-button react-flow__controls-interactive"
            >
              <img src="/undo-2.svg" alt="" className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="react-flow__controls-button react-flow__controls-interactive"
            >
              <img src="/redo-2.svg" alt="" className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  return (
    <TooltipProvider>
      <div className="flex gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
