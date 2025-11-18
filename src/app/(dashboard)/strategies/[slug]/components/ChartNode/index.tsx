"use client";
import { useRef } from "react";
import { Position } from "@xyflow/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn, preventNodeDeletionKeys } from "@/lib/utils";
import TradingViewChart from "./TradingViewChart";
import NodeWrapper from "../common/NodeWrapper";
import NodeHandle from "../common/NodeHandle";
import { useParams } from "next/navigation";

export default function ChartNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: any) {
  const strategyId = useParams()?.slug as string;
  const nodeControlRef = useRef(null);
  const canConnect = true;

  return (
    <>
      <NodeWrapper
        id={id}
        type="chartNode"
        strategyId={strategyId}
        className={cn("bg-white")}
      >
        <div className="react-flow__node" onKeyDown={preventNodeDeletionKeys}>
          <div ref={nodeControlRef} className={`nodrag`} />
          <TooltipProvider>
            <div
              className="w-auto max-w-fit !min-h-fit mx-auto bg-white rounded-lg shadow-sm border overflow-hidden relative"
              // className="w-[1000px] max-w-md min-h-80 mx-auto bg-white rounded-lg shadow-sm border overflow-hidden relative"
              onWheel={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <TradingViewChart />
            </div>
          </TooltipProvider>
          <NodeHandle
            type="source"
            canConnect={canConnect}
            position={sourcePosition}
          />
        </div>
      </NodeWrapper>
    </>
  );
}
