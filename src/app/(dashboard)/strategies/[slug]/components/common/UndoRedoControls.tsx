"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useUndoRedo } from "@/context/UndoRedoContext";

interface UndoRedoControlsProps {
  // undo?: () => void;
  // redo?: () => void;
  // canUndo?: boolean;
  // canRedo?: boolean;
}

export const UndoRedoControls = (props: UndoRedoControlsProps) => {
  // const { undo, redo, canUndo, canRedo } = props;
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  return (
    <TooltipProvider>
      <div className="flex flex-col">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="react-flow__controls-button react-flow__controls-interactive"
            >
              <img
                alt="Undo"
                className="h-4 w-4"
                src={!canUndo ? "/undo-disabled.svg" : "/undo.svg"}
              />
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
              onClick={redo}
              disabled={!canRedo}
              className="react-flow__controls-button react-flow__controls-interactive"
            >
              <img
                alt="Redo"
                className="h-4 w-4"
                src={!canRedo ? "/redo-disabled.svg" : "/redo.svg"}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
