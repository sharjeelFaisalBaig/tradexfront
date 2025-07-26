"use client";

import { useCallback, useRef, useState } from "react";
import type { Node, Edge } from "@xyflow/react";

// Define action types for tracking what caused each state change
export type ActionType =
  | "NODE_CREATE"
  | "NODE_DELETE"
  | "NODE_MOVE"
  | "EDGE_CREATE"
  | "EDGE_DELETE"
  | "INITIAL_LOAD";

interface ActionMetadata {
  type: ActionType;
  nodeData?: any; // Store full node data for recreation
  edgeData?: any; // Store full edge data for recreation
  nodeId?: string;
  edgeId?: string;
  position?: { x: number; y: number }; // For move operations
  // previousPosition?: { x: number; y: number }; // For move operations
  // newPosition?: { x: number; y: number }; // For move operations
  sourceNodeId?: string;
  targetNodeId?: string;
  timestamp: number;
  description?: string; // Human readable description for debugging
}

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  action: ActionMetadata;
}

interface UseUndoRedoOptions {
  maxHistorySize?: number;
  onApiCall?: (
    action: ActionMetadata,
    isUndo: boolean,
    isRedo: boolean
  ) => Promise<void>;
}

export const useUndoRedo = (
  initialNodes: Node[] = [],
  initialEdges: Edge[] = [],
  options: UseUndoRedoOptions = {}
) => {
  const { maxHistorySize = 50, onApiCall } = options;

  // History stack with action metadata
  const [history, setHistory] = useState<HistoryState[]>([
    {
      nodes: [...initialNodes],
      edges: [...initialEdges],
      action: {
        type: "INITIAL_LOAD",
        timestamp: Date.now(),
        description: "Initial state loaded",
      },
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Flag to prevent saving history during undo/redo operations
  const isUndoRedoOperation = useRef(false);

  // Save current state to history with action metadata
  const saveToHistory = useCallback(
    (nodes: Node[], edges: Edge[], actionMetadata: ActionMetadata) => {
      if (isUndoRedoOperation.current) {
        console.log("🚫 Skipping history save during undo/redo operation");
        return;
      }

      console.log(
        `📝 Saving to history: ${actionMetadata.type} - ${actionMetadata.description}`,
        {
          action: actionMetadata,
          nodesCount: nodes.length,
          edgesCount: edges.length,
        }
      );

      setHistory((prev) => {
        // Remove any future history if we're not at the end
        const newHistory = prev.slice(0, currentIndex + 1);

        // Add new state
        newHistory.push({
          nodes: JSON.parse(JSON.stringify(nodes)), // Deep copy to prevent mutations
          edges: JSON.parse(JSON.stringify(edges)), // Deep copy to prevent mutations
          action: { ...actionMetadata, timestamp: Date.now() },
        });

        // Limit history size
        if (newHistory.length > maxHistorySize) {
          console.log(`🗑️ History size limit reached, removing oldest entry`);
          newHistory.shift();
          return newHistory;
        }

        return newHistory;
      });

      // Update current index
      setCurrentIndex((prev) => {
        const newIndex = Math.min(prev + 1, maxHistorySize - 1);
        console.log(`📊 History updated: current index: ${newIndex}`);
        return newIndex;
      });
    },
    [currentIndex, maxHistorySize]
  );

  // Get the reverse action for undo operations
  const getReverseActionForUndo = (action: ActionMetadata): ActionMetadata => {
    switch (action.type) {
      case "NODE_CREATE":
        return {
          ...action,
          type: "NODE_DELETE",
          description: `Undo node creation: ${action.nodeId}`,
        };
      case "NODE_DELETE":
        return {
          ...action,
          type: "NODE_CREATE",
          description: `Undo node deletion: ${action.nodeId}`,
        };
      case "NODE_MOVE":
        return {
          ...action,
          type: "NODE_MOVE",
          // Swap positions for undo
          // previousPosition: action.newPosition,
          position: action.position,
          description: `Undo node move: ${action.nodeId}`,
        };
      case "EDGE_CREATE":
        return {
          ...action,
          type: "EDGE_DELETE",
          description: `Undo edge creation: ${action.sourceNodeId} → ${action.targetNodeId}`,
        };
      case "EDGE_DELETE":
        return {
          ...action,
          type: "EDGE_CREATE",
          description: `Undo edge deletion: ${action.sourceNodeId} → ${action.targetNodeId}`,
        };
      default:
        return action;
    }
  };

  // Undo function with API call
  const undo = useCallback(async () => {
    console.log({ currentIndex });

    if (currentIndex <= 0) {
      console.log("🚫 Cannot undo: already at the beginning of history");
      return null;
    }

    isUndoRedoOperation.current = true;

    const currentState = history[currentIndex];
    const previousState = history[currentIndex - 1];

    console.log(`🔄 UNDO: Reversing "${currentState.action.description}"`, {
      from: currentState.action,
      to: previousState.action,
      currentIndex,
      newIndex: currentIndex - 1,
    });

    // API: Trigger reverse API call for the action being undone
    if (onApiCall && currentState.action.type !== "INITIAL_LOAD") {
      const reverseAction = getReverseActionForUndo(currentState.action);
      console.log(
        `🌐 API: UNDO "${currentState.action.description}" → Calling ${reverseAction.type}`
      );

      try {
        await onApiCall(reverseAction, true, false);
        console.log(
          `✅ API: UNDO "${currentState.action.description}" completed successfully`
        );
      } catch (error) {
        console.error(
          `❌ API: UNDO "${currentState.action.description}" failed:`,
          error
        );
        isUndoRedoOperation.current = false;
        throw error;
      }
    }

    setCurrentIndex((prev) => prev - 1);
    console.log(`📊 Undo completed: moved to index ${currentIndex - 1}`);
    return previousState;
  }, [currentIndex, history, onApiCall]);

  // Redo function with API call
  const redo = useCallback(async () => {
    if (currentIndex >= history.length - 1) {
      console.log("🚫 Cannot redo: already at the end of history");
      return null;
    }

    isUndoRedoOperation.current = true;

    const nextState = history[currentIndex + 1];

    console.log(`🔄 REDO: Re-applying "${nextState.action.description}"`, {
      action: nextState.action,
      currentIndex,
      newIndex: currentIndex + 1,
    });

    // API: Trigger original API call for the action being redone
    if (onApiCall && nextState.action.type !== "INITIAL_LOAD") {
      console.log(`🌐 API: REDO "${nextState.action.description}"`);

      try {
        await onApiCall(nextState.action, false, true);
        console.log(
          `✅ API: REDO "${nextState.action.description}" completed successfully`
        );
      } catch (error) {
        console.error(
          `❌ API: REDO "${nextState.action.description}" failed:`,
          error
        );
        isUndoRedoOperation.current = false;
        throw error;
      }
    }

    setCurrentIndex((prev) => prev + 1);
    console.log(`📊 Redo completed: moved to index ${currentIndex + 1}`);
    return nextState;
  }, [currentIndex, history, onApiCall]);

  // Reset the undo/redo operation flag
  const resetUndoRedoFlag = useCallback(() => {
    isUndoRedoOperation.current = false;
  }, []);

  // Check if undo/redo is available
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Clear history
  const clearHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    console.log("🗑️ Clearing history and initializing with loaded data");
    setHistory([
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        action: {
          type: "INITIAL_LOAD",
          timestamp: Date.now(),
          description: "Data loaded from backend",
        },
      },
    ]);
    setCurrentIndex(0);
    isUndoRedoOperation.current = false;
  }, []);

  // Get current action info for debugging
  const getCurrentAction = useCallback(() => {
    return history[currentIndex]?.action;
  }, [history, currentIndex]);

  // Get history summary for debugging
  const getHistorySummary = useCallback(() => {
    return history.map((state, index) => ({
      index,
      isCurrent: index === currentIndex,
      action: state.action.description || state.action.type,
      nodesCount: state.nodes.length,
      edgesCount: state.edges.length,
    }));
  }, [history, currentIndex]);

  return {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    resetUndoRedoFlag,
    getCurrentAction,
    getHistorySummary,
    historySize: history.length,
    currentIndex,
  };
};
