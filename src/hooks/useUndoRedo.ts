"use client";

import { useCallback, useRef, useState } from "react";
import type { Node, Edge } from "@xyflow/react";

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseUndoRedoOptions {
  maxHistorySize?: number;
}

export const useUndoRedo = (
  initialNodes: Node[] = [],
  initialEdges: Edge[] = [],
  options: UseUndoRedoOptions = {}
) => {
  const { maxHistorySize = 50 } = options;

  // History stack
  const [history, setHistory] = useState<HistoryState[]>([
    { nodes: initialNodes, edges: initialEdges },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Flag to prevent saving history during undo/redo operations
  const isUndoRedoOperation = useRef(false);

  const cloneNodes = (nodes: Node[]) =>
    nodes.map((n) => ({
      ...n,
      data: { ...n.data }, // Clone file state or any other dynamic data
    }));

  // Save current state to history
  const saveToHistory = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      if (isUndoRedoOperation.current) return;

      setHistory((prev) => {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push({ nodes: cloneNodes(nodes), edges: [...edges] });
        // newHistory.push({ nodes: [...nodes], edges: [...edges] });

        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
          setCurrentIndex((prev) => Math.max(0, prev - 1));
          return newHistory;
        }

        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [currentIndex, maxHistorySize]
  );

  // Undo function
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoOperation.current = true;
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  // Redo function
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoOperation.current = true;
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  // Reset the undo/redo operation flag
  const resetUndoRedoFlag = useCallback(() => {
    isUndoRedoOperation.current = false;
  }, []);

  // Check if undo/redo is available
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Clear history
  const clearHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    setHistory([{ nodes: [...nodes], edges: [...edges] }]);
    setCurrentIndex(0);
  }, []);

  return {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    resetUndoRedoFlag,
    historySize: history.length,
    currentIndex,
  };
};
