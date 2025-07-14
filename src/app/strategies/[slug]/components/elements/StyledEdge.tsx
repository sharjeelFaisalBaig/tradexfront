"use client";

import type React from "react";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useReactFlow,
  type Edge,
} from "@xyflow/react";
import { X } from "lucide-react";
import { useDisconnectNodes } from "@/hooks/strategy/useStrategyMutations";
import { toast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import { getPeerTypeFromNodeType } from "@/lib/utils";

interface StyledEdgeProps {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
  markerEnd?: string;
  selected?: boolean;
}

export default function StyledEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: StyledEdgeProps) {
  const { setEdges, getNode } = useReactFlow();
  const strategyId = useParams().slug as string;
  const { mutate: disconnectNodes, isPending } = useDisconnectNodes();

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const onDeleteClick = async (event: React.MouseEvent) => {
    event.stopPropagation();

    // Get source node to extract its type
    const sourceNode = getNode(source);
    const sourceType = sourceNode?.type || "";

    // Disconnect backend
    disconnectNodes(
      {
        strategyId: strategyId,
        data: {
          source_peer_type: getPeerTypeFromNodeType(sourceType),
          source_peer_id: source,
          thread_peer_id: target,
        },
      },
      {
        onSuccess: () => {
          setEdges((edges) => edges.filter((edge) => edge.id !== id));
          toast({
            title: "Disconnected",
            description: "The connection has been removed successfully.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Failed to disconnect",
            description:
              error?.response?.data?.message || "Something went wrong.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: 2,
          stroke: selected ? "#ef4444" : "#6b7280",
          strokeDasharray: "5,5",
          transition: "stroke 0.2s ease",
        }}
      />

      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <button
              className="flex items-center justify-center w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 border-2 border-white"
              onClick={onDeleteClick}
              disabled={isPending}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
