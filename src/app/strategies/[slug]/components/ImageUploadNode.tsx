"use client";

import {
  useState,
  useRef,
  useEffect,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Plus,
  Upload,
  HelpCircle,
  Lightbulb,
  Loader2,
  Shield,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NodeWrapper from "./common/NodeWrapper";
import { useUploadImageContent } from "@/hooks/strategy/useStrategyMutations";
import { useParams } from "next/navigation";

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

export default function ImageUploadNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: any) {
  const { mutate: uploadImageContent, isPending: isUploading } =
    useUploadImageContent();

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

  console.log({ processingState, aiResponse, uploadedImage, data });

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

  // const handleFileSelect = (file: File) => {
  //   if (file && file.type.startsWith("image/")) {
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       const imageData = e.target?.result as string;
  //       setUploadedImage(imageData);
  //       setFileName(file.name);
  //       // Auto-process uploaded images
  //       processImageWithAI(imageData, file.name);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setProcessingState({
        isProcessing: true,
        isComplete: false,
        error: null,
      });
      setFileName(file.name);

      console.log({ file });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", "");
      formData.append("description", "");

      uploadImageContent(
        {
          strategyId: strategyId,
          peerId: data?.id,
          data: formData,
        },
        {
          onSuccess: (response: any) => {
            // Adjust this based on your API response structure
            setUploadedImage(response?.imageUrl || null);
            setProcessingState({
              isProcessing: false,
              isComplete: true,
              error: null,
            });
            // Optionally, trigger AI processing here if needed
            // processImageWithAI(response?.imageUrl, file.name);
          },
          onError: (error: any) => {
            setProcessingState({
              isProcessing: false,
              isComplete: false,
              error: error?.message || "Image upload failed",
            });
          },
        }
      );
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

  const handleNotesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserNotes(e.target.value);
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
        className={cn("bg-white", uploadedImage ? "h-[1px]" : "h-[2px]")}
      >
        <div className="relative react-flow__node">
          <div ref={nodeControlRef} className={`nodrag`} />

          <TooltipProvider>
            <div className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden">
              {!uploadedImage ? (
                // Upload Interface
                <div
                  className={cn(
                    "relative bg-white rounded-2xl p-12 transition-all duration-200 border-2 border-dashed",
                    isDragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300",
                    "cursor-pointer"
                  )}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleSelectFile}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div className="text-center">
                    <div className="mb-6">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFile();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-base font-medium"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Select a file
                      </Button>
                    </div>

                    <div className="text-gray-500 mb-4">
                      <span className="text-lg">or</span>
                    </div>

                    <div className="text-gray-600 text-lg">
                      Drag and drop a file here
                    </div>

                    <div className="text-sm text-gray-500 mt-4">
                      Supports: JPG, PNG, GIF, WebP
                    </div>
                  </div>

                  {isDragOver && (
                    <div className="absolute inset-0 bg-blue-100 bg-opacity-70 rounded-2xl flex items-center justify-center z-10">
                      <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                        <Upload className="w-12 h-12 text-blue-600 mb-2" />
                        <div className="text-blue-600 text-xl font-medium">
                          Drop your image here
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Processing/Preview Interface
                <div className="space-y-4">
                  {/* Header with AI Title or Processing State */}
                  <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isUploading || processingState.isProcessing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">
                            AI is analyzing your image...
                          </span>
                        </div>
                      ) : processingState.error ? (
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">
                            Processing failed
                          </span>
                        </div>
                      ) : aiResponse ? (
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {aiResponse.title}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 truncate">
                            📁 {fileName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canConnect && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              Ready to connect to other nodes
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {!canConnect &&
                        !processingState.isProcessing &&
                        uploadedImage && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Shield className="w-4 h-4 text-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">
                                Complete analysis to enable connections
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                    </div>
                  </div>

                  {/* Image Preview */}
                  <div className="px-4">
                    <div className="relative">
                      <img
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                        disabled={processingState.isProcessing}
                      >
                        <X className="w-4 h-4" />
                      </Button>

                      {/* Processing Overlay */}
                      {(isUploading || processingState.isProcessing) && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                              Processing...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error State */}
                  {processingState.error && (
                    <div className="px-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-xs text-red-600 font-medium mb-1">
                          Processing Error
                        </div>
                        <div className="text-sm text-red-700 mb-2">
                          {processingState.error}
                        </div>
                        <Button
                          onClick={handleReprocess}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                        >
                          Retry Processing
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Notes Input */}
                  <div className="px-4 pb-4">
                    <div className="relative">
                      <Input
                        placeholder="Add notes for AI to use..."
                        value={userNotes}
                        onChange={handleNotesChange}
                        className="pr-8 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={processingState.isProcessing}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            Add notes that will be used by AI to provide better
                            context and insights
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TooltipProvider>

          {/* <Handle
            type="source"
            position={sourcePosition}
            isConnectableEnd={canConnect}
            isConnectable={canConnect}
            isConnectableStart={canConnect}
            style={{ width: "30px", height: "30px" }}
          /> */}

          <Handle
            type="source"
            position={sourcePosition}
            isConnectable={canConnect}
            style={{
              width: 30,
              height: 30,
              // Remove any custom positioning
              position: "absolute", // Ensure absolute positioning
              [sourcePosition === Position.Right ? "right" : "left"]: -6, // Adjust for handle size
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1000,
            }}
          />
        </div>
      </NodeWrapper>
    </>
  );
}
