"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  useStoreApi,
  useReactFlow,
  type Connection,
  Controls,
  Edge,
} from "@xyflow/react";
import { Position } from "@xyflow/react";
import ImageUploadNode from "./ImageUploadNode";
import AudioPlayerNode from "./AudioPlayerNode";
import StyledEdge from "./elements/StyledEdge";
import RemoteNode from "./RemoteNode";
import DocumentUploadNode from "./DocumentUploadNode";
import SocialMediaNode from "./SocialMediaNode";
import VideoUploadNode from "./VideoUploadNode";
import AnnotationNode from "./AnnotationNode";
import StrategySidebar from "@/components/StrategySidebar";
import type { IStrategy } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import NewStrategyModal from "@/components/modal/NewStrategyModal";
import { useGetStrategyById } from "@/hooks/strategy/useStrategyQueries";
import Loader from "@/components/common/Loader";
import ChartNode from "./ChartNode";
import {
  useUpdatePeerPosition,
  useConnectNodes,
  useDisconnectNodes,
} from "@/hooks/strategy/useStrategyMutations";
import { getPeerTypeFromNodeType } from "@/lib/utils";
import StrategyHeader from "@/components/StrategyHeader";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import ChatBoxNode from "./ChatBoxNode";
import { useNodeOperations } from "../hooks/useNodeOperations";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { UndoRedoControls } from "./common/UndoRedoControls";

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

const initialNodes: any = [];
const initialEdges: any = [];

const nodeTypes = {
  chatbox: ChatBoxNode,
  imageUploadNode: ImageUploadNode,
  audioPlayerNode: AudioPlayerNode,
  remoteNode: RemoteNode,
  documentUploadNode: DocumentUploadNode,
  socialMediaNode: SocialMediaNode,
  videoUploadNode: VideoUploadNode,
  annotationNode: AnnotationNode,
  chartNode: ChartNode,
};

const edgeTypes = {
  styledEdge: StyledEdge,
};

const MIN_DISTANCE = 150;

interface StrategyProps {
  slug: string;
}

const Strategy = (props: StrategyProps) => {
  const { slug: strategyId } = props;
  const store = useStoreApi();
  const successNote = useSuccessNotifier();
  const { addToolNode, deleteNode } = useNodeOperations();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { getInternalNode, screenToFlowPosition } = useReactFlow();
  const [showNewStrategyModal, setShowNewStrategyModal] =
    useState<boolean>(false);

  const { mutate: updatePeerPosition } = useUpdatePeerPosition();
  const { mutate: connectNodes } = useConnectNodes();
  const { mutate: disconnectNodes } = useDisconnectNodes();
  const { data, isLoading, isError, error } = useGetStrategyById(strategyId);
  const strategy: IStrategy = useMemo(() => data?.data, [data]);

  // Track when nodes or edges change to save to history
  const [lastSavedState, setLastSavedState] = useState({
    nodes: initialNodes,
    edges: initialEdges,
  });

  // API call handler for undo/redo operations
  const handleApiCall = useCallback(
    async (actionMetadata: any, isUndo: boolean, isRedo: boolean) => {
      const {
        type,
        nodeData,
        edgeData,
        nodeId,
        edgeId,
        previousPosition,
        newPosition,
        sourceNodeId,
        targetNodeId,
      } = actionMetadata;

      console.log(`🌐 API Handler called:`, {
        action: type,
        isUndo,
        isRedo,
        description: actionMetadata.description,
        metadata: actionMetadata,
      });

      try {
        switch (type) {
          case "NODE_CREATE":
            if (isUndo) {
              // API: Delete the node that was created
              console.log(`🗑️ Action: UNDO Node Creation → API: deleteNode`);
              console.log(
                `📡 API Call: deleteNode(${nodeId}, ${getPeerTypeFromNodeType(
                  nodeData?.type
                )}, ${strategyId})`
              );

              if (nodeId && nodeData?.type) {
                const peerType = getPeerTypeFromNodeType(nodeData.type);
                deleteNode(nodeId, peerType, strategyId);
              }
            } else if (isRedo) {
              // API: Recreate the node
              console.log(`➕ Action: REDO Node Creation → API: addToolNode`);
              console.log(
                `📡 API Call: addToolNode({ peerType: ${getPeerTypeFromNodeType(
                  nodeData?.type
                )}, strategyId: ${strategyId}, positionXY: ${JSON.stringify(
                  nodeData?.position
                )} })`
              );

              if (nodeData) {
                const peerType = getPeerTypeFromNodeType(nodeData.type);
                addToolNode({
                  peerType: peerType,
                  strategyId,
                  positionXY: {
                    x: nodeData.position?.x,
                    y: nodeData.position?.y,
                  },
                });
              }
            }
            break;

          case "NODE_DELETE":
            if (isUndo) {
              // API: Recreate the deleted node
              console.log(`➕ Action: UNDO Node Deletion → API: addToolNode`);
              console.log(
                `📡 API Call: addToolNode({ peerType: ${getPeerTypeFromNodeType(
                  nodeData?.type
                )}, strategyId: ${strategyId}, positionXY: ${JSON.stringify(
                  nodeData?.position
                )} })`
              );

              if (nodeData) {
                const peerType = getPeerTypeFromNodeType(nodeData.type);
                addToolNode({
                  peerType: peerType,
                  strategyId,
                  positionXY: {
                    x: nodeData.position?.x,
                    y: nodeData.position?.y,
                  },
                });
              }
            } else if (isRedo) {
              // API: Delete the node again
              console.log(`🗑️ Action: REDO Node Deletion → API: deleteNode`);
              console.log(
                `📡 API Call: deleteNode(${nodeId}, ${getPeerTypeFromNodeType(
                  nodeData?.type
                )}, ${strategyId})`
              );

              if (nodeId && nodeData?.type) {
                const peerType = getPeerTypeFromNodeType(nodeData.type);
                deleteNode(nodeId, peerType, strategyId);
              }
            }
            break;

          case "NODE_MOVE":
            // API: Update node position
            const targetPosition = isUndo ? previousPosition : newPosition;
            console.log(
              `📍 Action: ${
                isUndo ? "UNDO" : isRedo ? "REDO" : ""
              } Node Move → API: updatePeerPosition`
            );
            console.log(
              `📡 API Call: updatePeerPosition({ strategyId: ${
                strategy?.id
              }, peerId: ${nodeId}, peerType: ${getPeerTypeFromNodeType(
                nodeData?.type
              )}, position_x: ${targetPosition?.x}, position_y: ${
                targetPosition?.y
              } })`
            );

            if (nodeId && nodeData?.type && targetPosition) {
              const peerType = getPeerTypeFromNodeType(nodeData.type);
              updatePeerPosition({
                strategyId: strategy?.id,
                peerId: nodeId,
                peerType: peerType,
                position_x: targetPosition.x,
                position_y: targetPosition.y,
              });
            }
            break;

          case "EDGE_CREATE":
            if (isUndo) {
              // API: Disconnect the nodes
              console.log(
                `🔌 Action: UNDO Edge Creation → API: disconnectNodes`
              );

              if (sourceNodeId && targetNodeId) {
                const sourceNode = nodes.find((n) => n.id === sourceNodeId);
                if (sourceNode) {
                  const sourcePeerType = getPeerTypeFromNodeType(
                    sourceNode.type ?? ""
                  );
                  console.log(
                    `📡 API Call: disconnectNodes({ strategyId: ${strategyId}, data: { source_peer_type: ${sourcePeerType}, source_peer_id: ${sourceNodeId}, thread_peer_id: ${targetNodeId} } })`
                  );

                  disconnectNodes({
                    strategyId: strategyId,
                    data: {
                      source_peer_type: sourcePeerType,
                      source_peer_id: sourceNodeId,
                      thread_peer_id: targetNodeId,
                    },
                  });
                }
              }
            } else if (isRedo) {
              // API: Reconnect the nodes
              console.log(`🔗 Action: REDO Edge Creation → API: connectNodes`);

              if (sourceNodeId && targetNodeId) {
                const sourceNode = nodes.find((n) => n.id === sourceNodeId);
                if (sourceNode) {
                  const sourcePeerType = getPeerTypeFromNodeType(
                    sourceNode.type ?? ""
                  );
                  console.log(
                    `📡 API Call: connectNodes({ strategyId: ${strategy?.id}, data: { source_peer_type: ${sourcePeerType}, source_peer_id: ${sourceNodeId}, thread_peer_id: ${targetNodeId} } })`
                  );

                  connectNodes({
                    strategyId: strategy?.id,
                    data: {
                      source_peer_type: sourcePeerType,
                      source_peer_id: sourceNodeId,
                      thread_peer_id: targetNodeId,
                    },
                  });
                }
              }
            }
            break;

          case "EDGE_DELETE":
            if (isUndo) {
              // API: Reconnect the nodes
              console.log(`🔗 Action: UNDO Edge Deletion → API: connectNodes`);

              if (sourceNodeId && targetNodeId) {
                const sourceNode = nodes.find((n) => n.id === sourceNodeId);
                if (sourceNode) {
                  const sourcePeerType = getPeerTypeFromNodeType(
                    sourceNode.type ?? ""
                  );
                  console.log(
                    `📡 API Call: connectNodes({ strategyId: ${strategy?.id}, data: { source_peer_type: ${sourcePeerType}, source_peer_id: ${sourceNodeId}, thread_peer_id: ${targetNodeId} } })`
                  );

                  connectNodes({
                    strategyId: strategy?.id,
                    data: {
                      source_peer_type: sourcePeerType,
                      source_peer_id: sourceNodeId,
                      thread_peer_id: targetNodeId,
                    },
                  });
                }
              }
            } else if (isRedo) {
              // API: Disconnect the nodes again
              console.log(
                `🔌 Action: REDO Edge Deletion → API: disconnectNodes`
              );

              if (sourceNodeId && targetNodeId) {
                const sourceNode = nodes.find((n) => n.id === sourceNodeId);
                if (sourceNode) {
                  const sourcePeerType = getPeerTypeFromNodeType(
                    sourceNode.type ?? ""
                  );
                  console.log(
                    `📡 API Call: disconnectNodes({ strategyId: ${strategyId}, data: { source_peer_type: ${sourcePeerType}, source_peer_id: ${sourceNodeId}, thread_peer_id: ${targetNodeId} } })`
                  );

                  disconnectNodes({
                    strategyId: strategyId,
                    data: {
                      source_peer_type: sourcePeerType,
                      source_peer_id: sourceNodeId,
                      thread_peer_id: targetNodeId,
                    },
                  });
                }
              }
            }
            break;

          default:
            console.log(`⚠️ Unhandled action type: ${type}`);
        }
      } catch (error) {
        console.error(`❌ API call failed for ${type}:`, error);
        throw error;
      }
    },
    [
      updatePeerPosition,
      connectNodes,
      strategy?.id,
      nodes,
      getPeerTypeFromNodeType,
      deleteNode,
      addToolNode,
      strategyId,
      disconnectNodes,
    ]
  );

  // Initialize undo/redo functionality
  const {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    resetUndoRedoFlag,
    getCurrentAction,
  } = useUndoRedo(initialNodes, initialEdges, { onApiCall: handleApiCall });

  // Save to history when nodes or edges change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Detect node changes
      const currentNodeIds = new Set(nodes.map((n) => n.id));
      const lastNodeIds = new Set(
        lastSavedState.nodes.map((n: { id: string }) => n.id)
      );

      // Check for new nodes (created)
      const newNodes = nodes.filter((n) => !lastNodeIds.has(n.id));
      if (newNodes.length > 0) {
        newNodes.forEach((node) => {
          console.log(`➕ Detected: Node created - ${node.id} (${node.type})`);
          saveToHistory(nodes, edges, {
            type: "NODE_CREATE",
            nodeId: node.id,
            nodeData: node,
            description: `Created ${node.type} node: ${node.id}`,
            timestamp: Date.now(),
          });
        });
      }

      // Check for deleted nodes
      const deletedNodes = lastSavedState.nodes.filter(
        (n: { id: string }) => !currentNodeIds.has(n.id)
      );
      if (deletedNodes.length > 0) {
        deletedNodes.forEach((node: any) => {
          console.log(`🗑️ Detected: Node deleted - ${node.id} (${node.type})`);
          saveToHistory(nodes, edges, {
            type: "NODE_DELETE",
            nodeId: node.id,
            nodeData: node,
            description: `Deleted ${node.type} node: ${node.id}`,
            timestamp: Date.now(),
          });
        });
      }

      // Detect edge changes
      const currentEdgeIds = new Set(edges.map((e) => e.id));
      const lastEdgeIds = new Set(
        lastSavedState.edges.map((e: { id: string }) => e.id)
      );

      // Check for new edges (created) - but skip if we already handled this in onConnect
      const newEdges = edges.filter(
        (e) => !lastEdgeIds.has(e.id) && !e.id.startsWith("edge-")
      );
      if (newEdges.length > 0) {
        newEdges.forEach((edge) => {
          console.log(`🔗 Detected: Edge created - ${edge.id}`);
          saveToHistory(nodes, edges, {
            type: "EDGE_CREATE",
            edgeId: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            edgeData: edge,
            description: `Connected nodes: ${edge.source} → ${edge.target}`,
            timestamp: Date.now(),
          });
        });
      }

      // Check for deleted edges
      const deletedEdges = lastSavedState.edges.filter(
        (e: { id: string }) => !currentEdgeIds.has(e.id)
      );
      if (deletedEdges.length > 0) {
        deletedEdges.forEach((edge: Edge) => {
          console.log(`🔌 Detected: Edge deleted - ${edge.id}`);

          // API: Disconnect nodes when edge is deleted
          const sourceNode = nodes.find((n) => n.id === edge.source);
          if (sourceNode) {
            const sourcePeerType = getPeerTypeFromNodeType(
              sourceNode.type ?? ""
            );
            console.log(
              `📡 API Call: DISCONNECT_NODES(${edge.source}, ${edge.target}, ${sourcePeerType})`
            );

            // Use your actual disconnectNodes function
            disconnectNodes({
              strategyId: strategyId,
              data: {
                source_peer_type: sourcePeerType,
                source_peer_id: edge.source,
                thread_peer_id: edge.target,
              },
            });
          }

          saveToHistory(nodes, edges, {
            type: "EDGE_DELETE",
            edgeId: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            edgeData: edge,
            description: `Disconnected nodes: ${edge.source} → ${edge.target}`,
            timestamp: Date.now(),
          });
        });
      }

      setLastSavedState({ nodes, edges });
      resetUndoRedoFlag();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    nodes,
    edges,
    saveToHistory,
    resetUndoRedoFlag,
    lastSavedState,
    strategyId,
    disconnectNodes,
    getPeerTypeFromNodeType,
  ]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key === "z"
      ) {
        event.preventDefault();
        handleUndo();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "y" || (event.shiftKey && event.key === "Z"))
      ) {
        event.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle undo operation
  const handleUndo = useCallback(async () => {
    try {
      console.log(`🔄 User triggered UNDO`);

      const previousState = await undo();

      console.log({ previousState });

      if (previousState) {
        console.log(`✅ UNDO completed, restoring state`);
        setNodes(previousState.nodes);
        setEdges(previousState.edges);
      }
    } catch (error) {
      console.error(`❌ UNDO failed:`, error);
      toast({
        title: "Undo failed",
        description: "Failed to undo the last action. Please try again.",
        variant: "destructive",
      });
    }
  }, [undo, setNodes, setEdges, toast]);

  // Handle redo operation
  const handleRedo = useCallback(async () => {
    try {
      console.log(`🔄 User triggered REDO`);
      const nextState = await redo();
      if (nextState) {
        console.log(`✅ REDO completed, restoring state`);
        setNodes(nextState.nodes);
        setEdges(nextState.edges);
      }
    } catch (error) {
      console.error(`❌ REDO failed:`, error);
      toast({
        title: "Redo failed",
        description: "Failed to redo the last action. Please try again.",
        variant: "destructive",
      });
    }
  }, [redo, setNodes, setEdges, toast]);

  // Define the type for pasted/dropped content directly in this component
  type PastedContentType =
    | { type: "image-file"; data: File }
    | { type: "image-url"; data: string }
    | { type: "audio-file"; data: File }
    | { type: "video-file"; data: File }
    | { type: "document-file"; data: File }
    | { type: "youtube"; data: string }
    | { type: "tiktok"; data: string }
    | { type: "instagram"; data: string }
    | { type: "facebook"; data: string }
    | { type: "website url"; data: string }
    | { type: "plain text"; data: string }
    | { type: "unknown"; data: null };

  // Utility function to process DataTransfer items (for both paste and drop)
  const processDataTransferItems = useCallback(
    async (
      items: DataTransferItemList | undefined | null
    ): Promise<PastedContentType> => {
      if (!items) {
        return { type: "unknown", data: null };
      }

      const urlRegex = /https?:\/\/[^\s]+/i;
      const imageFileExtensionRegex = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
      const socialMediaPlatforms = [
        {
          name: "youtube",
          regex:
            /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/)?([\w-]{11})(?:\S+)?/i,
        },
        {
          name: "tiktok",
          regex:
            /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com)\/@([\w.-]+)\/video\/(\d+)(?:\S+)?/i,
        },
        {
          name: "instagram",
          regex:
            /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com)\/(?:p|reel|tv)\/([\w-]+)(?:\S+)?/i,
        },
        {
          name: "facebook",
          regex:
            /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com)\/(?:video\.php\?v=|watch\/\?v=|permalink\.php\?story_fbid=|groups\/[\w.-]+\/permalink\/)?([\w.-]+)(?:\S+)?/i,
        },
      ] as const;

      const itemPromises: Promise<PastedContentType | null>[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (!file) {
            itemPromises.push(Promise.resolve(null));
            continue;
          }

          if (file.type.startsWith("image/")) {
            itemPromises.push(
              Promise.resolve({ type: "image-file", data: file })
            );
          } else if (file.type.startsWith("video/")) {
            itemPromises.push(
              Promise.resolve({ type: "video-file", data: file })
            );
          } else if (file.type.startsWith("audio/")) {
            itemPromises.push(
              Promise.resolve({ type: "audio-file", data: file })
            );
          } else if (
            file.type.startsWith("application/pdf") ||
            file.type.startsWith("application/msword") ||
            file.type.startsWith(
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ) ||
            file.type.startsWith(
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ) ||
            file.type.startsWith(
              "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
          ) {
            itemPromises.push(
              Promise.resolve({ type: "document-file", data: file })
            );
          } else {
            itemPromises.push(Promise.resolve(null));
          }
        } else if (item.kind == "string") {
          const stringPromise = new Promise<PastedContentType | null>(
            (resolve) => {
              item.getAsString((text) => {
                if (urlRegex.test(text)) {
                  if (imageFileExtensionRegex.test(text)) {
                    resolve({ type: "image-url", data: text });
                  } else {
                    let matchedPlatform: PastedContentType["type"] =
                      "website url";
                    for (const p of socialMediaPlatforms) {
                      if (p.regex.test(text)) {
                        matchedPlatform = p.name;
                        break;
                      }
                    }
                    resolve({ type: matchedPlatform, data: text });
                  }
                } else {
                  resolve({ type: "plain text", data: text });
                }
              });
            }
          );
          itemPromises.push(stringPromise);
        }
      }

      const potentialResults = (await Promise.all(itemPromises)).filter(
        Boolean
      ) as PastedContentType[];

      const prioritizedOrder: PastedContentType["type"][] = [
        "image-file",
        "video-file",
        "audio-file",
        "document-file",
        "image-url",
        "youtube",
        "tiktok",
        "instagram",
        "facebook",
        "website url",
        "plain text",
      ];

      let finalPastedItem: PastedContentType = { type: "unknown", data: null };
      for (const type of prioritizedOrder) {
        const found = potentialResults.find((result) => result.type === type);
        if (found) {
          finalPastedItem = found;
          break;
        }
      }

      return finalPastedItem;
    },
    []
  );

  // Handle initial node creation and loading from flows
  useEffect(() => {
    if (!strategy) return;

    const flows = strategy.flows;
    const isEmptyFlows =
      Array.isArray(flows) &&
      flows.length > 0 &&
      [
        "annotationPeers",
        "aiImagePeers",
        "aiVideoPeers",
        "aiAudioPeers",
        "aiDocsPeers",
        "aiRemotePeers",
        "aiSocialMediaPeers",
        "aiThreadPeers",
      ].every(
        (key) =>
          Array.isArray((flows[0] as any)[key]) &&
          (flows[0] as any)[key].length === 0
      );

    if (!flows || flows.length === 0 || isEmptyFlows) {
      console.log("Nodes not exists");
      // Clear history when loading empty strategy
      clearHistory([], []);
    } else {
      const flow = flows[0];
      if (!flow) return;

      const nodesFromFlows: any[] = [];
      const pushNodes = (peers: any[], type: string) => {
        if (!Array.isArray(peers)) return;
        peers.forEach((peer) => {
          nodesFromFlows.push({
            id: peer.id,
            type,
            position: { x: peer.position_x, y: peer.position_y },
            data: { ...peer },
            ...nodeDefaults,
          });
        });
      };

      pushNodes(flow.annotationPeers, "annotationNode");
      pushNodes(flow.aiImagePeers, "imageUploadNode");
      pushNodes(flow.aiAudioPeers, "audioPlayerNode");
      pushNodes(flow.aiVideoPeers, "videoUploadNode");
      pushNodes(flow.aiDocsPeers, "documentUploadNode");
      pushNodes(flow.aiSocialMediaPeers, "socialMediaNode");
      pushNodes(flow.aiRemotePeers, "remoteNode");
      pushNodes(flow.aiThreadPeers, "chatbox");

      setNodes(nodesFromFlows);

      if (
        Array.isArray(flow.strategyFlowEdges) &&
        flow.strategyFlowEdges.length > 0
      ) {
        const edgesFromFlows = flow.strategyFlowEdges.map((edge: any) => ({
          id: edge.id,
          source: edge.source_peer,
          target: edge.target_peer,
          type: "styledEdge",
          animated: true,
        }));
        setEdges(edgesFromFlows);
      } else {
        setEdges([]);
      }

      // Initialize history with loaded data
      // @ts-ignore
      clearHistory(nodesFromFlows, flow.strategyFlowEdges || []);
    }
  }, [strategy, setNodes, setEdges, clearHistory]);

  useEffect(() => {
    if (error) {
      toast({
        title: error?.message || "Error",
        // @ts-ignore
        description: error?.response?.data?.message || "Failed to send OTP.",
        variant: "destructive",
      });
    }
  }, [error]);

  const toggleNewStrategyModal = () => {
    setShowNewStrategyModal((prev) => !prev);
  };

  // Renamed from handleCreateNodeOnPaste and modified to accept optional position
  const handleCreateNode = useCallback(
    (type: string, data?: any, position?: { x: number; y: number }) => {
      console.log(`➕ Action: Creating node of type ${type}`);

      // API: Create node request will be triggered by addToolNode
      console.log(`📡 API Call: CREATE_NODE will be triggered by addToolNode`);

      addToolNode({
        peerType: type,
        strategyId,
        dataToAutoUpload: { data },
        positionXY: { x: position?.x, y: position?.y },
      });

      // Note: We'll save to history in the useEffect that monitors node changes
      // This ensures we capture the actual node data after creation
    },
    [addToolNode, strategyId]
  );

  // Add paste event handler for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      // Ignore if user is typing/pasting in an input, textarea, or any editable element
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) {
        console.log("No clipboard items found.");
        return;
      }

      // Prevent default paste behavior for all relevant types upfront
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (
          item.kind === "file" ||
          (item.kind === "string" &&
            (item.type === "text/plain" ||
              item.type === "text/html" ||
              item.type === "text/uri-list"))
        ) {
          e.preventDefault();
        }
      }

      const finalPastedItem = await processDataTransferItems(items);
      if (finalPastedItem.type !== "unknown") {
        console.log("Known Pasted Item:", finalPastedItem);
        // Call handleCreateNode based on the detected type
        switch (finalPastedItem.type) {
          case "plain text":
            handleCreateNode("annotation", finalPastedItem.data as string);
            break;
          case "youtube":
          case "tiktok":
          case "instagram":
          case "facebook":
            handleCreateNode("social", finalPastedItem.data as string);
            break;
          case "website url":
            handleCreateNode("remote", finalPastedItem.data as string);
            break;
          case "image-file":
          case "image-url":
            handleCreateNode("image", finalPastedItem.data);
            break;
          case "video-file":
            handleCreateNode("video", finalPastedItem.data as File);
            break;
          case "document-file":
            handleCreateNode("document", finalPastedItem.data as File);
            break;
          case "audio-file":
            handleCreateNode("audio", finalPastedItem.data as File);
            break;
          default:
            // @ts-ignore
            console.log("Unhandled pasted item type:", finalPastedItem.type);
            break;
        }
      } else {
        console.log("Pasted Item Type: Unknown");
      }
    };

    // Add event listener to the document
    document.addEventListener("paste", handlePaste);

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handleCreateNode, processDataTransferItems]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      const edgeId = `edge-${params.source}-${params.target}-${Date.now()}`;

      if (!sourceNode || !targetNode) return;

      console.log(
        `🔗 Action: Connecting nodes ${params.source} → ${params.target}`
      );

      // 1. Update UI state
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "styledEdge",
            animated: true,
            id: edgeId,
          },
          eds
        )
      );

      // 2. API: Backend request to connect nodes
      console.log(
        `📡 API Call: CONNECT_NODES(${params.source}, ${params.target})`
      );
      connectNodes(
        {
          strategyId: strategy?.id,
          data: {
            source_peer_type: getPeerTypeFromNodeType(sourceNode.type ?? ""),
            source_peer_id: sourceNode.id,
            thread_peer_id: targetNode.id,
          },
        },
        {
          onSuccess: () => {
            console.log(`✅ API: Node connection successful`);
            successNote({
              title: "Nodes connected",
              description: "Successfully connected nodes.",
            });

            // 3. Save to history after successful API call
            saveToHistory(
              nodes,
              [
                ...edges,
                {
                  ...params,
                  type: "styledEdge",
                  animated: true,
                  id: edgeId,
                },
              ],
              {
                type: "EDGE_CREATE",
                edgeId,
                sourceNodeId: params.source,
                targetNodeId: params.target,
                edgeData: {
                  ...params,
                  type: "styledEdge",
                  animated: true,
                  id: edgeId,
                },
                description: `Connected nodes: ${params.source} → ${params.target}`,
                timestamp: Date.now(),
              }
            );
          },
          onError: (error: any) => {
            console.error(`❌ API: Node connection failed:`, error);
            // 4. Revert edge on failure
            setEdges((eds) => eds.filter((e) => e.id !== edgeId));
            toast({
              title: "Connection failed",
              description:
                error?.response?.data?.message || "Failed to connect nodes.",
              variant: "destructive",
            });
          },
        }
      );
    },
    [
      setEdges,
      nodes,
      edges,
      connectNodes,
      strategy,
      toast,
      successNote,
      saveToHistory,
      getPeerTypeFromNodeType,
    ]
  );

  const getClosestEdge = useCallback(
    (node: any) => {
      const { nodeLookup } = store.getState();
      const internalNode: any = getInternalNode(node.id);

      const closestNode = Array.from(nodeLookup.values()).reduce(
        (res: any, n: any) => {
          if (n.id !== internalNode.id) {
            const dx =
              n.internals.positionAbsolute.x -
              internalNode.internals.positionAbsolute.x;
            const dy =
              n.internals.positionAbsolute.y -
              internalNode.internals.positionAbsolute.y;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < res.distance && d < MIN_DISTANCE) {
              res.distance = d;
              res.node = n;
            }
          }

          return res;
        },
        {
          distance: Number.MAX_VALUE,
          node: null,
        }
      );

      if (!closestNode.node) {
        return null;
      }

      const closeNodeIsSource =
        closestNode.node.internals.positionAbsolute.x <
        internalNode.internals.positionAbsolute.x;

      return {
        id: closeNodeIsSource
          ? `${closestNode.node.id}-${node.id}`
          : `${node.id}-${closestNode.node.id}`,
        source: closeNodeIsSource ? closestNode.node.id : node.id,
        target: closeNodeIsSource ? node.id : closestNode.node.id,
        type: "styledEdge",
        animated: true,
      };
    },
    [getInternalNode, store]
  );

  const onNodeDrag = useCallback(
    (_: any, node: any) => {
      const closeEdge: any = getClosestEdge(node);

      setEdges((es) => {
        const nextEdges = es.filter((e: any) => e.className !== "temp");

        if (
          closeEdge &&
          !nextEdges.find(
            (ne: any) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target
          )
        ) {
          closeEdge.className = "temp";
          closeEdge.type = "styledEdge";
          closeEdge.animated = true;
          nextEdges.push(closeEdge);
        }

        return nextEdges;
      });
    },
    [getClosestEdge, setEdges]
  );

  const onNodeDragStop = useCallback(
    (_: any, node: any) => {
      const closeEdge: any = getClosestEdge(node);

      setEdges((es) => {
        const nextEdges = es.filter((e: any) => e.className !== "temp");

        if (
          closeEdge &&
          !nextEdges.find(
            (ne: any) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target
          )
        ) {
          closeEdge.type = "styledEdge";
          closeEdge.animated = true;
          nextEdges.push(closeEdge);
        }

        return nextEdges;
      });

      console.log(
        `📍 Action: Node ${node.id} moved to position (${node.position.x}, ${node.position.y})`
      );

      const peerType = getPeerTypeFromNodeType(node.type);

      // API: Update peer position in backend
      if (node.id && node?.type && strategy?.id) {
        console.log(
          `📡 API Call: UPDATE_POSITION(${node.id}, ${node.position.x}, ${node.position.y})`
        );

        updatePeerPosition({
          strategyId: strategy?.id,
          peerId: node.id,
          peerType: peerType,
          position_x: node.position.x,
          position_y: node.position.y,
        });

        // Save position change to history
        saveToHistory(nodes, edges, {
          type: "NODE_MOVE",
          nodeId: node.id,
          nodeData: node,
          position: { x: node.position.x, y: node.position.y },
          description: `Moved ${node.type} node: ${node.id}`,
          timestamp: Date.now(),
        });
      }
    },
    [
      getClosestEdge,
      setEdges,
      strategy?.id,
      updatePeerPosition,
      nodes,
      edges,
      saveToHistory,
      getPeerTypeFromNodeType,
    ]
  );

  const defaultEdgeOptions = {
    type: "styledEdge",
    animated: true,
    style: {
      strokeWidth: 2,
      stroke: "#6b7280",
    },
  };

  // New drag and drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const finalDroppedItem = await processDataTransferItems(
        event.dataTransfer.items
      );

      if (finalDroppedItem.type !== "unknown") {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        console.log(
          "Known Dropped Item:",
          finalDroppedItem,
          "at position:",
          position
        );

        switch (finalDroppedItem.type) {
          case "plain text":
            handleCreateNode(
              "annotation",
              finalDroppedItem.data as string,
              position
            );
            break;
          case "youtube":
          case "tiktok":
          case "instagram":
          case "facebook":
            handleCreateNode(
              "social",
              finalDroppedItem.data as string,
              position
            );
            break;
          case "website url":
            handleCreateNode(
              "remote",
              finalDroppedItem.data as string,
              position
            );
            break;
          case "image-file":
          case "image-url":
            handleCreateNode("image", finalDroppedItem.data, position);
            break;
          case "video-file":
            handleCreateNode("video", finalDroppedItem.data as File, position);
            break;
          case "document-file":
            handleCreateNode(
              "document",
              finalDroppedItem.data as File,
              position
            );
            break;
          case "audio-file":
            handleCreateNode("audio", finalDroppedItem.data as File, position);
            break;
          default:
            // @ts-ignore
            console.log("Unhandled dropped item type:", finalDroppedItem.type);
            break;
        }
      } else {
        console.log("Dropped Item Type: Unknown");
      }
    },
    [screenToFlowPosition, handleCreateNode, processDataTransferItems]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
        <Loader text="Loading strategy..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-red-600 text-lg font-semibold">
          Failed to load strategy.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col !min-h-screen bg-gray-50 dark:bg-gray-900">
      {showNewStrategyModal && (
        <NewStrategyModal
          strategy={strategy}
          isOpen={showNewStrategyModal}
          onClose={toggleNewStrategyModal}
        />
      )}
      <StrategyHeader
        strategy={strategy}
        onEditStrategy={toggleNewStrategyModal}
      />
      <div className="flex flex-1 overflow-hidden">
        <StrategySidebar strategyId={strategyId} />
        <main className="relative flex-1 overflow-y-auto p-6">
          {/* Undo/Redo Controls */}
          <div className="absolute top-4 left-4 z-10">
            <UndoRedoControls
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            defaultViewport={{ x: 0, y: 0, zoom: 0.7578582832551992 }}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
            panOnScroll={true}
            panOnScrollSpeed={0.5}
            defaultEdgeOptions={defaultEdgeOptions}
            elementsSelectable={true}
            fitView
            fitViewOptions={{
              padding: 0.5,
              includeHiddenNodes: false,
              duration: 300,
            }}
            minZoom={0.1}
            maxZoom={2}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </main>
      </div>
    </div>
  );
};

export default Strategy;
