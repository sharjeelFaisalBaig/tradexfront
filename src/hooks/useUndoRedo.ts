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

interface UndoRedoResult {
  nodes?: Node[];
  edges?: Edge[];
  changes?: {
    addedNodes?: Node[];
    removedNodes?: Node[];
    addedEdges?: Edge[];
    removedEdges?: Edge[];
  };
}

export const useUndoRedo = (
  initialNodes: Node[] = [],
  initialEdges: Edge[] = [],
  options: UseUndoRedoOptions = {}
) => {
  const { maxHistorySize = 50 } = options;

  const [history, setHistory] = useState<HistoryState[]>([
    { nodes: initialNodes, edges: initialEdges },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isUndoRedoOperation = useRef(false);

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

  const getChanges = (prevState: HistoryState, newState: HistoryState) => {
    const addedNodes = newState.nodes.filter(
      (node) => !prevState.nodes.some((n) => n.id === node.id)
    );
    const removedNodes = prevState.nodes.filter(
      (node) => !newState.nodes.some((n) => n.id === node.id)
    );
    const addedEdges = newState.edges.filter(
      (edge) =>
        !prevState.edges.some(
          (e) => e.source === edge.source && e.target === edge.target
        )
    );
    const removedEdges = prevState.edges.filter(
      (edge) =>
        !newState.edges.some(
          (e) => e.source === edge.source && e.target === edge.target
        )
    );

    return {
      addedNodes,
      removedNodes,
      addedEdges,
      removedEdges,
    };
  };

  const undo = useCallback((): UndoRedoResult | null => {
    if (currentIndex <= 0) {
      return null;
    }

    isUndoRedoOperation.current = true;
    const prevIndex = currentIndex - 1;
    const prevState = history[prevIndex];
    const currentState = history[currentIndex];

    setCurrentIndex(prevIndex);

    const changes = getChanges(currentState, prevState);

    return {
      nodes: prevState.nodes,
      edges: prevState.edges,
      changes,
    };
  }, [currentIndex, history]);

  const redo = useCallback((): UndoRedoResult | null => {
    if (currentIndex >= history.length - 1) {
      return null;
    }

    isUndoRedoOperation.current = true;
    const nextIndex = currentIndex + 1;
    const nextState = history[nextIndex];
    const currentState = history[currentIndex];

    setCurrentIndex(nextIndex);

    const changes = getChanges(currentState, nextState);

    return {
      nodes: nextState.nodes,
      edges: nextState.edges,
      changes,
    };
  }, [currentIndex, history]);

  const resetUndoRedoFlag = useCallback(() => {
    isUndoRedoOperation.current = false;
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

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
