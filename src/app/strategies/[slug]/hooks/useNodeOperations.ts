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
  useDeleteImagePeer,
  useDeleteAudioPeer,
  useDeleteVideoPeer,
  useDeleteDocumentPeer,
  useDeleteSocialPeer,
  useDeleteRemotePeer,
  useDeleteThreadPeer,
  useCreateAnnotationPeer,
  useDeleteAnnotationPeer,
} from "@/hooks/strategy/useStrategyMutations";
import { toast } from "@/hooks/use-toast";

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
    case "annotation":
      return {
        ...base,
        data: {
          annotation: {
            content: "This is a sample annotation for collaborative notes!",
            author: "Demo User",
            createdAt: new Date().toISOString(),
            theme: "yellow",
          },
        },
        type: "annotationNode",
      };
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

  // Hooks for create mutations
  const { mutate: createAnnotationPeer } = useCreateAnnotationPeer();
  const { mutate: createImagePeer } = useCreateImagePeer();
  const { mutate: createAudioPeer } = useCreateAudioPeer();
  const { mutate: createVideoPeer } = useCreateVideoPeer();
  const { mutate: createDocumentPeer } = useCreateDocumentPeer();
  const { mutate: createThreadPeer } = useCreateThreadPeer();
  const { mutate: createSocialPeer } = useCreateSocialPeer();
  const { mutate: createRemotePeer } = useCreateRemotePeer();

  // Hooks for delete mutations
  const { mutate: deleteAnnotationPeer } = useDeleteAnnotationPeer();
  const { mutate: deleteImagePeer } = useDeleteImagePeer();
  const { mutate: deleteAudioPeer } = useDeleteAudioPeer();
  const { mutate: deleteVideoPeer } = useDeleteVideoPeer();
  const { mutate: deleteDocumentPeer } = useDeleteDocumentPeer();
  const { mutate: deleteSocialPeer } = useDeleteSocialPeer();
  const { mutate: deleteRemotePeer } = useDeleteRemotePeer();
  const { mutate: deleteThreadPeer } = useDeleteThreadPeer();

  const addToolNode = useCallback(
    ({
      dataToAutoUpload = {},
      peerType: tool,
      strategyId,
      positionXY,
    }: {
      peerType: Tool;
      strategyId: string;
      dataToAutoUpload?: any;
      positionXY?: { x?: number; y?: number };
    }) => {
      const position = { x: positionXY?.x ?? 500, y: positionXY?.y ?? 500 };
      const newNode = toolToNode(tool, position);

      if (!newNode) return;

      // 🧠 Trigger mutation request based on tool
      const payload = {
        strategyId,
        data: { position_x: position.x, position_y: position.y }, // you can also add label/title etc.
      };

      const addNodeWithResponse = (responseData: any) => {
        setNodes((nodes) => [
          ...nodes,
          {
            ...newNode,
            id: responseData?.peer_id,
            data: {
              ...(Object.keys(dataToAutoUpload)?.length > 0
                ? { dataToAutoUpload }
                : {}),
              ...newNode.data,
              id: responseData?.peer_id,
              ...responseData,
            },
          },
        ]);
      };

      switch (tool) {
        case "annotation":
          createAnnotationPeer(payload, {
            onSuccess: (data) => addNodeWithResponse(data),
          });
          break;
        case "image":
          createImagePeer(payload, {
            onSuccess: (data) => addNodeWithResponse(data),
          });
          break;
        case "audio":
          createAudioPeer(payload, {
            onSuccess: (data) => addNodeWithResponse(data),
          });
          break;
        case "video":
          createVideoPeer(payload, {
            onSuccess: (data) => addNodeWithResponse(data),
          });
          break;
        case "document":
          createDocumentPeer(payload, {
            onSuccess: (data) => addNodeWithResponse(data),
          });
          break;
        case "social":
          createSocialPeer(payload, {
            onSuccess: (data) => addNodeWithResponse(data),
          });
          break;
        case "remote":
          createRemotePeer(payload, {
            onSuccess: (data) => addNodeWithResponse(data),
          });
          break;
        case "AI Assistant":
          createThreadPeer(payload, {
            onSuccess: (data) => addNodeWithResponse(data),
          });
          break;
        default:
          break;
      }
    },
    [setNodes, createImagePeer, createVideoPeer, createDocumentPeer]
  );

  const deleteNode = useCallback(
    (nodeId: string, nodeType: string, strategyId: string) => {
      const removeNodeFromState = () => {
        setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
        setEdges((edges) =>
          edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          )
        );
      };

      // Map node type to correct mutation
      const deleteMutationMap: Record<string, any> = {
        imageUploadNode: deleteImagePeer,
        audioPlayerNode: deleteAudioPeer,
        videoUploadNode: deleteVideoPeer,
        documentUploadNode: deleteDocumentPeer,
        socialMediaNode: deleteSocialPeer,
        remoteNode: deleteRemotePeer,
        chatbox: deleteThreadPeer,
        annotationNode: deleteAnnotationPeer,
      };

      const mutation = deleteMutationMap[nodeType];

      if (mutation) {
        removeNodeFromState();
        mutation(
          { strategyId, peerId: nodeId },
          {
            onError: (error: any) => {
              toast({
                title: "Failed to delete node",
                description:
                  error?.response?.data?.message ?? "Something went wrong...",
                variant: "destructive",
              });
            },
          }
        );
      } else {
        // fallback: just remove from state
        // removeNodeFromState();
        toast({
          title: "Error",
          description: "Failed to delete node",
          variant: "destructive",
        });
      }
    },
    [
      setNodes,
      setEdges,
      deleteImagePeer,
      deleteAudioPeer,
      deleteVideoPeer,
      deleteDocumentPeer,
      deleteSocialPeer,
      deleteRemotePeer,
      deleteThreadPeer,
    ]
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
