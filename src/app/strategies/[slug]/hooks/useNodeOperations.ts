"use client";

import { useCallback } from "react";
import { Position, useReactFlow } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import { Tool } from "@/lib/types";

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

// Helper to convert Tool to Node
const toolToNode = (tool: Tool): Node<any> | null => {
  const id = crypto.randomUUID();
  const base = {
    id,
    position: { x: 500, y: 500 },
    ...nodeDefaults,
  };

  switch (tool) {
    case "image":
      return {
        ...base,
        data: { label: "Image Upload" },
        type: "imageUploadNode",
      };
    case "video":
      return {
        ...base,
        data: { label: "Video Upload" },
        type: "videoUploadNode",
      };
    case "document":
      return {
        ...base,
        data: { label: "Document Upload" },
        type: "documentUploadNode",
      };
    case "AI Assistant":
      return {
        ...base,
        data: { label: "Chatbox" },
        type: "chatbox",
      };
    default:
      return null;
  }
};

// Hook for node management operations
export const useNodeOperations = () => {
  const { setNodes, setEdges } = useReactFlow();

  // add tool node
  const addToolNode = useCallback(
    (tool: Tool) => {
      const newNode = toolToNode(tool);
      if (!newNode) return;

      console.log({ newNode });

      setNodes((nodes) => [...nodes, newNode]);
    },
    [setNodes]
  );

  // Delete node and all connected edges
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

  // Update node data
  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      );
    },
    [setNodes]
  );

  // Update node size with minimum width constraint
  const updateNodeSize = useCallback(
    (nodeId: string, width: number, height: number, minWidth: number = 300) => {
      const constrainedWidth = Math.max(width, minWidth);

      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                style: {
                  ...node.style,
                  width: constrainedWidth,
                  height: height,
                },
                data: {
                  ...node.data,
                  nodeSize: { width: constrainedWidth, height },
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  return { addToolNode, deleteNode, updateNodeData, updateNodeSize };
};
