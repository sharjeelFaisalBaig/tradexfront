"use client";

import React, {
  createContext,
  useCallback,
  useRef,
  useState,
  useContext,
  ReactNode,
} from "react";
import type { Node, Edge } from "@xyflow/react";

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UndoRedoContextProps {
  saveToHistory: (nodes: Node[], edges: Edge[]) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: (nodes: Node[], edges: Edge[]) => void;
  resetUndoRedoFlag: () => void;
  currentIndex: number;
  historySize: number;
}

const UndoRedoContext = createContext<UndoRedoContextProps | undefined>(
  undefined
);

export const UndoRedoProvider = ({
  children,
  initialNodes = [],
  initialEdges = [],
  maxHistorySize = 50,
}: {
  children: ReactNode;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  maxHistorySize?: number;
}) => {
  const [history, setHistory] = useState<HistoryState[]>([
    { nodes: initialNodes, edges: initialEdges },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoOperation = useRef(false);

  // Clone nodes (preserve file state & other dynamic data)
  const cloneNodes = (nodes: Node[]) =>
    nodes.map((n) => ({
      ...n,
      data: { ...n.data },
    }));

  const saveToHistory = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      if (isUndoRedoOperation.current) return;

      setHistory((prev) => {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push({ nodes: cloneNodes(nodes), edges: [...edges] });

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

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const current = history[currentIndex];
      const prev = history[currentIndex - 1];

      // If node exists in both states but only file differs → just clear file
      const fileChangedNode = current.nodes.find((node) => {
        const prevNode = prev.nodes.find((p) => p.id === node.id);
        return prevNode && prevNode.data.file !== node.data.file;
      });

      if (fileChangedNode) {
        console.log("Undo: Resetting file for node first");
        fileChangedNode.data.file = null; // clear file
        saveToHistory(current.nodes, current.edges);
        return { nodes: [...current.nodes], edges: [...current.edges] };
      }

      isUndoRedoOperation.current = true;
      setCurrentIndex((prev) => prev - 1);
      return prev;
    }
    return null;
  }, [currentIndex, history, saveToHistory]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoOperation.current = true;
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const resetUndoRedoFlag = useCallback(() => {
    isUndoRedoOperation.current = false;
  }, []);

  const clearHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    setHistory([{ nodes: [...nodes], edges: [...edges] }]);
    setCurrentIndex(0);
  }, []);

  return (
    <UndoRedoContext.Provider
      value={{
        saveToHistory,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        clearHistory,
        resetUndoRedoFlag,
        historySize: history.length,
        currentIndex,
      }}
    >
      {children}
    </UndoRedoContext.Provider>
  );
};

export const useUndoRedoContext = () => {
  const ctx = useContext(UndoRedoContext);
  if (!ctx)
    throw new Error("useUndoRedoContext must be used within UndoRedoProvider");
  return ctx;
};
