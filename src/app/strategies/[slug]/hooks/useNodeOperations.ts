"use client";

import { useCallback } from "react";
import { Position, useReactFlow } from "@xyflow/react";
import { Tool } from "@/lib/types";
import {
  useCreateImagePeer,
  useCreateVideoPeer,
  useCreateDocumentPeer,
  useCreateThreadPeer,
  useCreateAudioPeer,
  useCreateSocialPeer,
  useCreateRemotePeer,
} from "@/hooks/strategy/useStrategyMutations"; // import your mutations

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

// Helper to convert Tool to Node
const toolToNode = (tool: Tool, position: { x: number; y: number }) => {
  const id = crypto.randomUUID();
  const base = {
    id,
    position,
    ...nodeDefaults,
  };

  switch (tool) {
    case "image":
      return {
        ...base,
        data: { label: "Image Upload" },
        type: "imageUploadNode",
      };
    case "audio":
      return {
        ...base,
        data: { label: "Audio Upload" },
        type: "audioPlayerNode",
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
    case "social":
      return {
        ...base,
        data: { label: "Social Media Upload" },
        type: "socialMediaNode",
      };
    case "remote":
      return {
        ...base,
        data: { label: "Website Upload" },
        type: "remoteNode",
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

export const useNodeOperations = () => {
  const { setNodes, setEdges } = useReactFlow();

  // Hooks for mutation
  const { mutate: createImagePeer } = useCreateImagePeer();
  const { mutate: createAudioPeer } = useCreateAudioPeer();
  const { mutate: createVideoPeer } = useCreateVideoPeer();
  const { mutate: createDocumentPeer } = useCreateDocumentPeer();
  const { mutate: createThreadPeer } = useCreateThreadPeer();
  const { mutate: createSocialPeer } = useCreateSocialPeer();
  const { mutate: createRemotePeer } = useCreateRemotePeer();

  const addToolNode = useCallback(
    (tool: Tool, strategyId: string) => {
      const position = { x: 500, y: 500 };
      const newNode = toolToNode(tool, position);

      console.log({ newNode });

      if (!newNode) return;

      // 🧠 Trigger mutation request based on tool
      const payload = {
        strategyId,
        data: { position_x: position.x, position_y: position.y }, // you can also add label/title etc.
      };

      switch (tool) {
        case "image":
          createImagePeer(payload);
          break;
        case "audio":
          createAudioPeer(payload);
          break;
        case "video":
          createVideoPeer(payload);
          break;
        case "document":
          createDocumentPeer(payload);
          break;
        case "social":
          createSocialPeer(payload);
          break;
        case "remote":
          createRemotePeer(payload);
          break;
        case "AI Assistant":
          createThreadPeer(payload);
          break;
        default:
          break;
      }

      setNodes((nodes) => [...nodes, newNode]);
    },
    [setNodes, createImagePeer, createVideoPeer, createDocumentPeer]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

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

  return {
    addToolNode, // now expects (tool, strategyId)
    deleteNode,
    updateNodeData,
    updateNodeSize,
  };
};
