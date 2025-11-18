"use client";

import { Node, Edge, XYPosition } from "@xyflow/react";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { useNodeOperations } from "@/app/(dashboard)/strategies/[slug]/hooks/useNodeOperations";
import { Tool } from "@/lib/types";

// Define your types and context as before
export type Action =
  | { type: "ADD_NODE"; node: Node }
  | { type: "DELETE_NODE"; node: Node }
  | { type: "UPLOAD_FILE"; nodeId: string; fileUrl: string }
  | { type: "REMOVE_FILE"; nodeId: string; fileUrl: string }
  | { type: "ADD_EDGE"; edge: Edge }
  | { type: "REMOVE_EDGE"; edge: Edge }
  | { type: "MOVE_NODE"; nodeId: string; from: XYPosition; to: XYPosition };

type UndoRedoContextType = {
  addAction: (action: Action) => void;
  batchUpdate: (actions: Action[]) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
};

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(
  undefined
);

export const UndoRedoProvider = ({ children }: { children: ReactNode }) => {
  // node operations hook
  const { addToolNode, deleteNode } = useNodeOperations();

  // states
  const [undoStack, setUndoStack] = useState<Action[]>([]);
  const [redoStack, setRedoStack] = useState<Action[]>([]);

  const addAction = (action: Action) => {
    setUndoStack((prev) => [...prev, action]);
    setRedoStack([]);
  };

  const undo = async () => {
    const lastAction = undoStack.at(-1);
    if (!lastAction) return;

    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastAction]);

    try {
      switch (lastAction.type) {
        case "ADD_NODE":
          await deleteNode(
            lastAction?.node?.id,
            lastAction?.node?.type as string,
            lastAction?.node?.data?.strategyId as string
          );
          break;
        case "DELETE_NODE":
          await addToolNode({
            peerType: lastAction?.node?.data?.tool as Tool,
            strategyId: lastAction.node.data.strategyId as string,
            positionXY: lastAction?.node?.position,
          });
          break;
        // Handle other actions similarly
      }
    } catch (error) {
      console.error("Failed to undo action:", error);
      setUndoStack((prev) => [...prev, lastAction]);
      setRedoStack((prev) => prev.slice(0, -1));
    }
  };

  const redo = async () => {
    const nextAction = redoStack.at(-1);
    if (!nextAction) return;

    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, nextAction]);

    try {
      switch (nextAction.type) {
        case "ADD_NODE":
          await addToolNode({
            peerType: nextAction.node.data.tool as Tool,
            strategyId: nextAction.node.data.strategyId as string,
            positionXY: nextAction.node.position,
          });
          break;
        case "DELETE_NODE":
          await deleteNode(
            nextAction.node.id,
            nextAction.node.type as string,
            nextAction.node.data.strategyId as string
          );
          break;
        // Handle other actions similarly
      }
    } catch (error) {
      console.error("Failed to redo action:", error);
      setRedoStack((prev) => [...prev, nextAction]);
      setUndoStack((prev) => prev.slice(0, -1));
    }
  };

  const batchUpdate = async (actions: Action[]) => {
    try {
      for (const action of actions) {
        switch (action.type) {
          case "ADD_NODE":
            await addToolNode({
              peerType: action.node.data.tool as Tool,
              strategyId: action.node.data.strategyId as string,
              positionXY: action.node.position,
            });
            break;
          case "DELETE_NODE":
            await deleteNode(
              action.node.id,
              action.node.type as string,
              action.node.data.strategyId as string
            );
            break;
          // Handle other actions similarly
        }
      }
      setUndoStack((prev) => [...prev, ...actions]);
      setRedoStack([]);
    } catch (error) {
      console.error("Failed to batch update actions:", error);
    }
  };

  return (
    <UndoRedoContext.Provider
      value={{
        addAction,
        batchUpdate,
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
      }}
    >
      {children}
    </UndoRedoContext.Provider>
  );
};

export const useUndoRedo = () => {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error("useUndoRedo must be used within UndoRedoProvider");
  }
  return context;
};
