"use client";

import {
  useState,
  useRef,
  useEffect,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { Position, useReactFlow } from "@xyflow/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import NodeWrapper from "./common/NodeWrapper";
import { useParams } from "next/navigation";
import NodeHandle from "./common/NodeHandle";

// Types for API integration
interface AIProcessingResponse {
  title: string;
  peerId: string;
  analysis: string;
  confidence: number;
  tags: string[];
}

interface ProcessingState {
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
}

export default function ChartNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: any) {
  const strategyId = useParams()?.slug as string;

  const nodeControlRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setEdges } = useReactFlow();

  // Image states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Processing states
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isComplete: false,
    error: null,
  });

  // AI Response states
  const [aiResponse, setAiResponse] = useState<AIProcessingResponse | null>(
    null
  );
  const [userNotes, setUserNotes] = useState<string>("");

  // Handle pasted image data from props
  useEffect(() => {
    if (data?.pastedImage && data?.pastedFileName) {
      setUploadedImage(data.pastedImage);
      setFileName(data.pastedFileName);
      // Auto-process pasted images
      processImageWithAI(data.pastedImage, data.pastedFileName);
    }
  }, [data]);

  // AI responses for different image types
  const processImage = (filename: string): AIProcessingResponse => {
    return {
      title: "Urban Sunset Photography",
      peerId: "peer_7x9k2m4n8p",
      analysis:
        "This image captures a stunning urban sunset with warm golden tones illuminating modern architecture. The composition demonstrates excellent use of natural lighting and geometric patterns.",
      confidence: 0.94,
      tags: ["sunset", "urban", "architecture", "golden hour", "cityscape"],
    };
  };

  // API Integration Function
  const processImageWithAI = async (imageData: string, filename: string) => {
    setProcessingState({
      isProcessing: true,
      isComplete: false,
      error: null,
    });

    try {
      // Simulate API processing time (2-4 seconds)
      const processingTime = Math.random() * 2000 + 2000;

      await new Promise((resolve) => setTimeout(resolve, processingTime));

      // throw new Error("AI service temporarily unavailable")

      // Get AI response
      const result = processImage(filename);

      // Update states with API response
      setAiResponse(result);
      setProcessingState({
        isProcessing: false,
        isComplete: true,
        error: null,
      });

      console.log("🤖 AI Response:", result);
    } catch (error) {
      console.error("AI Processing Error:", error);
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: error instanceof Error ? error.message : "Processing failed",
      });
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        setFileName(file.name);
        // Auto-process uploaded images
        processImageWithAI(imageData, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setFileName("");
    setAiResponse(null);
    setProcessingState({
      isProcessing: false,
      isComplete: false,
      error: null,
    });
    setUserNotes("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReprocess = () => {
    if (uploadedImage && fileName) {
      processImageWithAI(uploadedImage, fileName);
    }
  };

  // Determine if connection should be allowed
  const canConnect: any =
    processingState.isComplete && aiResponse && !processingState.error;

  // Remove connections when node becomes not connectable
  useEffect(() => {
    if (!canConnect) {
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id)
      );
    }
  }, [canConnect, id, setEdges]);

  return (
    <>
      <NodeWrapper
        id={id}
        type="chartNode"
        strategyId={strategyId}
        className={cn("bg-white", uploadedImage ? "h-[1px]" : "h-[2px]")}
      >
        <div className="relative react-flow__node">
          <div ref={nodeControlRef} className={`nodrag`} />

          <TooltipProvider>
            <div className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="text-gray-600 text-lg">Chart Node</div>
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
