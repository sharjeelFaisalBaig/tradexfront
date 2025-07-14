"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  useStoreApi,
  useReactFlow,
  Connection,
} from "@xyflow/react";
import { Position } from "@xyflow/react";
import ChatBoxNode from "./ChatBoxNode";
import ImageUploadNode from "./ImageUploadNode";
import AudioPlayerNode from "./AudioPlayerNode";
import StyledEdge from "./elements/StyledEdge";
import RemoteNode from "./RemoteNode";
import DocumentUploadNode from "./DocumentUploadNode";
import SocialMediaNode from "./SocialMediaNode";
import VideoUploadNode from "./VideoUploadNode";
import AnnotationNode from "./AnnotationNode";
import StrategySidebar from "@/components/StrategySidebar";
import { IStrategy } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import NewStrategyModal from "@/components/modal/NewStrategyModal";
import { useGetStrategyById } from "@/hooks/strategy/useStrategyQueries";
import Loader from "@/components/common/Loader";
import ChartNode from "./ChartNode";
import {
  useSavePeerPositions,
  useCreateImagePeer,
  useCreateAudioPeer,
  useCreateVideoPeer,
  useCreateDocumentPeer,
  useCreateSocialPeer,
  useCreateThreadPeer,
  useCreateRemotePeer,
  useUpdatePeerPosition,
} from "@/hooks/strategy/useStrategyMutations";
import { getPeerTypeFromNodeType } from "@/lib/utils";

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

const initialNodes = [
  {
    id: "4",
    position: { x: -536.3887162260439, y: -807.6168221531623 },
    data: { label: "Url Search" },
    type: "remoteNode",
    ...nodeDefaults,
  },
  {
    id: "2",
    position: { x: -535.3098126574953, y: -416.71218936766786 },
    data: { label: "Image Upload" },
    type: "imageUploadNode",
    ...nodeDefaults,
  },
  {
    id: "3",
    position: { x: -535.2583827124738, y: -47.79763972050168 },
    data: { label: "Audio Player" },
    type: "audioPlayerNode",
    ...nodeDefaults,
  },
  {
    id: "5",
    position: { x: 24.569308041643296, y: -16.381814680330294 },
    data: { label: "Document Upload" },
    type: "documentUploadNode",
    ...nodeDefaults,
  },
  {
    id: "7",
    position: { x: 576.5473916470279, y: -8.984699488204 },
    data: { label: "Video Upload" },
    type: "videoUploadNode",
    ...nodeDefaults,
  },
  {
    id: "6",
    position: { x: 1197.838085675496, y: -803.2743598026047 },
    data: { label: "Social Media" },
    type: "socialMediaNode",
    ...nodeDefaults,
  },
  {
    id: "1",
    position: { x: 4.689513204926413, y: -803.7316620685999 },
    data: { label: "Chatbox" },
    type: "chatbox",
    ...nodeDefaults,
  },
  {
    id: "8",
    position: { x: 1212.8047809500401, y: -359.45483177740834 },
    data: {
      annotation: {
        content: "This is a sample annotation for collaborative notes!",
        author: "Demo User",
        createdAt: new Date().toISOString(),
        theme: "yellow",
      },
    },
    type: "annotationNode",
  },
  // {
  //   id: "9",
  //   position: { x: 0, y: 620 },
  //   data: { label: "Chart" },
  //   type: "chartNode",
  //   ...nodeDefaults,
  // },
];

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
  const { slug } = props;

  const store = useStoreApi();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { getInternalNode, getViewport } = useReactFlow();

  const [showNewStrategyModal, setShowNewStrategyModal] =
    useState<boolean>(false);

  const { mutate: savePositions } = useSavePeerPositions();
  const { mutate: updatePeerPosition } = useUpdatePeerPosition();

  // Peer creation mutations
  const { mutate: createImagePeer } = useCreateImagePeer();
  const { mutate: createAudioPeer } = useCreateAudioPeer();
  const { mutate: createVideoPeer } = useCreateVideoPeer();
  const { mutate: createDocumentPeer } = useCreateDocumentPeer();
  const { mutate: createSocialPeer } = useCreateSocialPeer();
  const { mutate: createThreadPeer } = useCreateThreadPeer();
  const { mutate: createRemotePeer } = useCreateRemotePeer();

  const { data, isLoading, isError, error } = useGetStrategyById(slug);
  const strategy: IStrategy = useMemo(() => data?.data, [data]);

  // Handle initial node creation and loading from flows
  useEffect(() => {
    if (!strategy) return;

    // Helper to check if flows is empty (all peer arrays are empty)
    const flows = strategy.flows;
    const isEmptyFlows =
      Array.isArray(flows) &&
      flows.length > 0 &&
      [
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
      // Create all initial nodes as peers
      initialNodes.forEach((node) => {
        switch (node.type) {
          case "imageUploadNode":
            createImagePeer({
              strategyId: strategy.id,
              data: {
                title: node.data.label,
                position_x: node.position.x,
                position_y: node.position.y,
              },
            });
            break;
          case "audioPlayerNode":
            createAudioPeer({
              strategyId: strategy.id,
              data: {
                title: node.data.label,
                position_x: node.position.x,
                position_y: node.position.y,
              },
            });
            break;
          case "videoUploadNode":
            createVideoPeer({
              strategyId: strategy.id,
              data: {
                title: node.data.label,
                position_x: node.position.x,
                position_y: node.position.y,
              },
            });
            break;
          case "documentUploadNode":
            createDocumentPeer({
              strategyId: strategy.id,
              data: {
                title: node.data.label,
                position_x: node.position.x,
                position_y: node.position.y,
              },
            });
            break;
          case "socialMediaNode":
            createSocialPeer({
              strategyId: strategy.id,
              data: {
                title: node.data.label,
                position_x: node.position.x,
                position_y: node.position.y,
              },
            });
            break;
          case "chatbox":
            createThreadPeer({
              strategyId: strategy.id,
              data: {
                title: node.data?.label || "AI Assistant",
                position_x: node.position.x,
                position_y: node.position.y,
              },
            });
            break;
          case "remoteNode":
            createRemotePeer({
              strategyId: strategy.id,
              data: {
                title: node.data.label,
                position_x: node.position.x,
                position_y: node.position.y,
              },
            });
            break;
          default:
            break;
        }
      });
    } else {
      // If flows exist, set nodes from flows
      const flow = flows[0];
      if (!flow) return;
      const nodesFromFlows: any[] = [];
      const pushNodes = (peers: any[], type: string, labelKey = "title") => {
        if (!Array.isArray(peers)) return;
        peers.forEach((peer) => {
          nodesFromFlows.push({
            id: peer.id,
            type,
            position: { x: peer.position_x, y: peer.position_y },
            data: { label: peer[labelKey] || type },
            ...nodeDefaults,
          });
        });
      };
      pushNodes(flow.aiImagePeers, "imageUploadNode");
      pushNodes(flow.aiAudioPeers, "audioPlayerNode");
      pushNodes(flow.aiVideoPeers, "videoUploadNode");
      pushNodes(flow.aiDocsPeers, "documentUploadNode");
      pushNodes(flow.aiSocialMediaPeers, "socialMediaNode");
      pushNodes(flow.aiRemotePeers, "remoteNode");
      pushNodes(flow.aiThreadPeers, "chatbox");
      setNodes(nodesFromFlows);
    }
  }, [strategy]);

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

  // Add paste event handler for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();

          const file = item.getAsFile();
          if (!file) continue;

          // Convert file to data URL
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageData = event.target?.result as string;

            // Get current viewport center
            const viewport = getViewport();
            const centerX =
              (-viewport.x + window.innerWidth / 2) / viewport.zoom;
            const centerY =
              (-viewport.y + window.innerHeight / 2) / viewport.zoom;

            // Create new image upload node with pasted image data
            const newNode = {
              id: `image-upload-${Date.now()}`,
              type: "imageUploadNode",
              position: { x: centerX - 500, y: centerY - 150 }, // Center the node (adjusted for 1000px width)
              data: {
                label: "Image Upload",
                pastedImage: imageData,
                pastedFileName: file.name || "pasted-image.png",
              },
              ...nodeDefaults,
            };

            // Add the new node
            setNodes((nds) => [...nds, newNode]);
          };

          reader.readAsDataURL(file);
          break; // Only handle the first image
        }
      }
    };

    // Add event listener to document
    document.addEventListener("paste", handlePaste);

    // Cleanup
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [setNodes, getViewport]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "styledEdge",
            animated: true,
            id: `edge-${params.source}-${params.target}-${Date.now()}`,
          },
          eds
        )
      );
    },
    [setEdges, nodes]
  );

  const getClosestEdge = useCallback((node: any) => {
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
  }, []);

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
      console.log({ Node_ID: node.id, Node_Position: node.position });

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

      const peerType = getPeerTypeFromNodeType(node.type);

      console.log("NODE_POSITION_UPDATE", {
        node,
        strategyId: strategy?.id,
        peerId: node.id,
        peerType: `peerType: (${peerType}) | node: (${node.type})`,
        position_x: node.position.x,
        position_y: node.position.y,
      });

      // ✅ Mutation call for updating peer position
      if (node.id && node?.type && strategy?.id) {
        updatePeerPosition({
          strategyId: strategy?.id,
          peerId: node.id,
          peerType: peerType,
          position_x: node.position.x,
          position_y: node.position.y,
        });
      }
    },
    [getClosestEdge, setEdges, strategy?.id, updatePeerPosition]
  );

  const defaultEdgeOptions = {
    type: "styledEdge",
    animated: true,
    style: {
      strokeWidth: 2,
      stroke: "#6b7280",
    },
  };

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

      <Header strategy={strategy} onEditStrategy={toggleNewStrategyModal} />
      <div className="flex flex-1 overflow-hidden">
        <StrategySidebar strategyId={slug} />
        <main className="relative flex-1 overflow-y-auto p-6">
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
            // new props
            fitView
            fitViewOptions={{
              padding: 0.5,
              includeHiddenNodes: false,
              duration: 300,
            }}
            minZoom={0.1}
            maxZoom={2}
          >
            <Background />
          </ReactFlow>
        </main>
      </div>
    </div>
  );
};

export default Strategy;
