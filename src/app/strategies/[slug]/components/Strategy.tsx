"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  useStoreApi,
  useReactFlow,
  Connection,
  Controls,
  MiniMap,
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
import { IStrategy } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import NewStrategyModal from "@/components/modal/NewStrategyModal";
import { useGetStrategyById } from "@/hooks/strategy/useStrategyQueries";
import Loader from "@/components/common/Loader";
import ChartNode from "./ChartNode";
import {
  useSavePeerPositions,
  useUpdatePeerPosition,
  useConnectNodes,
} from "@/hooks/strategy/useStrategyMutations";
import { getPeerTypeFromNodeType } from "@/lib/utils";
import StrategyHeader from "@/components/StrategyHeader";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import ChatBoxNode from "./ChatBoxNode";
import { useNodeOperations } from "../hooks/useNodeOperations";

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
  const { addToolNode } = useNodeOperations();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { getInternalNode, getViewport } = useReactFlow();

  const [showNewStrategyModal, setShowNewStrategyModal] =
    useState<boolean>(false);

  const { mutate: savePositions } = useSavePeerPositions();
  const { mutate: updatePeerPosition } = useUpdatePeerPosition();
  const { mutate: connectNodes } = useConnectNodes();

  const { data, isLoading, isError, error } = useGetStrategyById(strategyId);
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
    } else {
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

      // ✅ Safely set edges
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
        setEdges([]); // fallback to empty
      }
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
    // Define the type for pasted content
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

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      console.log("Clipboard items:", items);
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

      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
      const imageFileExtensionRegex = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
      const socialMediaPlatforms = [
        {
          name: "youtube",
          regex:
            /(?:https?:\/\/)?(?:www\.|m\.|)(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\\w-]{11})(?:\S+)?/i,
        },
        {
          name: "tiktok",
          regex:
            /(?:https?:\/\/)?(?:www\.|)(?:tiktok\.com)\/@([\\w.-]+)\/video\/(\d+)(?:\S+)?/i,
        },
        {
          name: "instagram",
          regex:
            /(?:https?:\/\/)?(?:www\.|)(?:instagram\.com)\/(?:p|reel|tv)\/([\\w-]+)(?:\S+)?/i,
        },
        {
          name: "facebook",
          regex:
            /(?:https?:\/\/)?(?:www\.|)(?:facebook\.com)\/(?:video\.php\?v=|watch\/\?v=|permalink\.php\?story_fbid=|groups\/[\\w.-]+\/permalink\/|)([\\w.-]+)(?:\S+)?/i,
        },
      ] as const;

      const itemPromises: Promise<PastedContentType | null>[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(
          `Processing item ${i}: kind='${item.kind}', type='${item.type}'`
        );

        if (item.kind === "file") {
          const file = item.getAsFile();
          if (!file) {
            console.log(`Item ${i} (file): getAsFile() returned null.`);
            itemPromises.push(Promise.resolve(null)); // Push a resolved null promise
            continue;
          }
          console.log(
            `Item ${i} (file): file.type='${file.type}', file.name='${file.name}', file.size=${file.size}`
          );

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
            ) || // .xlsx
            file.type.startsWith(
              "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            ) // .pptx
          ) {
            itemPromises.push(
              Promise.resolve({ type: "document-file", data: file })
            );
          } else {
            console.log(
              `Item ${i} (file): Unrecognized file type: '${file.type}'`
            );
            itemPromises.push(Promise.resolve(null));
          }
        } else if (item.kind === "string") {
          // Wrap getAsString in a Promise to handle its asynchronous nature
          const stringPromise = new Promise<PastedContentType | null>(
            (resolve) => {
              item.getAsString((text) => {
                console.log(
                  `Item ${i} (string/${item.type}): text='${text.substring(
                    0,
                    Math.min(text.length, 100)
                  )}...'`
                );
                if (item.type === "text/uri-list") {
                  const url = text.split("\n")[0]; // Take the first URL if multiple
                  if (urlRegex.test(url)) {
                    if (imageFileExtensionRegex.test(url)) {
                      resolve({ type: "image-url", data: url });
                    } else {
                      let matchedPlatform: PastedContentType["type"] =
                        "website url";
                      for (const p of socialMediaPlatforms) {
                        if (p.regex.test(url)) {
                          matchedPlatform = p.name;
                          break;
                        }
                      }
                      resolve({ type: matchedPlatform, data: url });
                    }
                  } else {
                    resolve(null); // Not a valid URL in uri-list
                  }
                } else if (item.type === "text/html") {
                  // Try to extract image src from HTML
                  const imgMatch = text.match(/<img[^>]+src="([^">]+)"/i);
                  if (imgMatch && imgMatch[1] && urlRegex.test(imgMatch[1])) {
                    resolve({ type: "image-url", data: imgMatch[1] });
                  } else {
                    // Try to extract href from anchor tags
                    const aMatch = text.match(/<a[^>]+href="([^">]+)"/i);
                    if (aMatch && aMatch[1] && urlRegex.test(aMatch[1])) {
                      let matchedPlatform: PastedContentType["type"] =
                        "website url";
                      for (const p of socialMediaPlatforms) {
                        if (p.regex.test(aMatch[1])) {
                          matchedPlatform = p.name;
                          break;
                        }
                      }
                      resolve({ type: matchedPlatform, data: aMatch[1] });
                    } else {
                      resolve(null); // No specific URL or image found in HTML
                    }
                  }
                } else if (item.type === "text/plain") {
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
                } else {
                  resolve(null); // Unhandled string type
                }
              });
            }
          );
          itemPromises.push(stringPromise); // Push the promise, don't await yet
        }
      }

      // Await all promises after the loop has collected them
      const potentialResults = (await Promise.all(itemPromises)).filter(
        Boolean
      ) as PastedContentType[];
      console.log("All collected and filtered results:", potentialResults);

      // Define the order of priority for content types
      // Files are prioritized over URLs, and specific URLs over general ones, then plain text.
      const prioritizedOrder: PastedContentType["type"][] = [
        "image-file",
        "video-file",
        "audio-file",
        "document-file",
        "image-url", // Prioritize image URLs after actual files
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
          break; // Found the highest priority item, stop searching
        }
      }

      console.log("Final Pasted Item Result:", finalPastedItem);

      if (finalPastedItem.type !== "unknown") {
        console.log("Pasted Item Type:", finalPastedItem.type);
        console.log("Pasted Data:", finalPastedItem.data);

        // Call addToolNode based on the detected type
        switch (finalPastedItem.type) {
          case "plain text":
            handleCreateNodeOnPaste(
              "annotation",
              finalPastedItem.data as string
            );
            break;
          case "youtube":
          case "tiktok":
          case "instagram":
          case "facebook":
            handleCreateNodeOnPaste("social", finalPastedItem.data as string);
            break;
          case "website url":
            handleCreateNodeOnPaste("remote", finalPastedItem.data as string);
            break;
          case "image-file":
            handleCreateNodeOnPaste("image", finalPastedItem.data as File);
            break;
          case "image-url": // Image URL is handled as an image type, but with a string URL
            handleCreateNodeOnPaste("image", finalPastedItem.data as string);
            break;
          case "video-file":
            handleCreateNodeOnPaste("video", finalPastedItem.data as File);
            break;
          case "document-file":
            handleCreateNodeOnPaste("document", finalPastedItem.data as File);
            break;
          case "audio-file":
            handleCreateNodeOnPaste("audio", finalPastedItem.data as File);
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
  }, [addToolNode, strategyId]); // The empty dependency array ensures this effect runs once on mount and cleans up on unmount [^3].

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      const edgeId = `edge-${params.source}-${params.target}-${Date.now()}`;

      if (!sourceNode || !targetNode) return;

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

      // 2. Backend request
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
            successNote({
              title: "Nodes connected",
              description: "Successfully connected nodes.",
            });
          },
          onError: (error: any) => {
            // 3. Revert edge on failure
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
    [setEdges, nodes, connectNodes, strategy, toast]
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

  const handleCreateNodeOnPaste = (type: string, data?: any) => {
    console.log("handleCreateNodeOnPaste:", { type, data });

    addToolNode({
      peerType: type,
      strategyId,
      dataToAutoUpload: { image: data },
    }); // (nodeType, strategyId, dataToAutoUpload)
  };

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

      <StrategyHeader
        strategy={strategy}
        onEditStrategy={toggleNewStrategyModal}
      />
      <div className="flex flex-1 overflow-hidden">
        <StrategySidebar strategyId={strategyId} />
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
            <MiniMap />
            <Controls />
          </ReactFlow>
        </main>
      </div>
    </div>
  );
};

export default Strategy;
