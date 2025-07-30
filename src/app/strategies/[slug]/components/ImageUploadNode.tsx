"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { Position, useReactFlow } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { X, Plus, Upload, Lightbulb, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import NodeWrapper from "./common/NodeWrapper";
import {
  useAnalyzeImagePeer,
  useResetPeer,
  useUploadImageContent,
} from "@/hooks/strategy/useStrategyMutations";
import { useParams } from "next/navigation";
import { useGetPeerAnalysisStatus } from "@/hooks/strategy/useGetPeerAnalysisStatus";
import { toast } from "@/hooks/use-toast";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import AiNoteInput from "./common/AiNoteInput";
import NodeHandle from "./common/NodeHandle";
import IsReadyToInteract from "./common/IsReadyToInteract";

// Enhanced types
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
  lastFailedOperation: "upload" | "analyze" | "status" | null;
}

interface ImageUploadNodeProps {
  id: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  data: any;
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ImageUploadNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: ImageUploadNodeProps) {
  const strategyId = useParams()?.slug as string;
  const successNote = useSuccessNotifier();
  const { setEdges, updateNodeData } = useReactFlow();

  // Refs
  const nodeControlRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastUploadedFileRef = useRef<File | null>(null);

  // Mutations
  const { mutate: resetPeer, isPending: isResetting } = useResetPeer();
  const {
    mutate: uploadImageContent,
    isPending: isUploading,
    isError: isUploadError,
    error: uploadError,
  } = useUploadImageContent();
  const {
    mutate: analyzeImageContent,
    isPending: isAnalyzing,
    isSuccess: isAnalyzeSuccess,
    isError: isAnalyzeError,
    error: analyzeError,
  } = useAnalyzeImagePeer();

  // State
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [isPollingRestarting, setIsPollingRestarting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<AIProcessingResponse | null>(
    null
  );
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isComplete: false,
    error: null,
    lastFailedOperation: null,
  });

  // Status polling
  const {
    data: status,
    restartPolling,
    error: statusError,
    isError: isStatusError,
    isPollingLoading: isStatusPollingLoading,
  } = useGetPeerAnalysisStatus({
    peerId: data?.id,
    strategyId,
    peerType: "image",
    enabled: isPollingRestarting || isAnalyzeSuccess,
  });

  // Memoized values
  const canConnect = useMemo(
    () =>
      !isResetting &&
      (data?.is_ready_to_interact || status?.is_ready_to_interact),
    [data?.is_ready_to_interact, status?.is_ready_to_interact, isResetting]
  );

  const isProcessingAny = useMemo(
    () =>
      isUploading ||
      isAnalyzing ||
      processingState.isProcessing ||
      isStatusPollingLoading,
    [
      isUploading,
      isAnalyzing,
      processingState.isProcessing,
      isStatusPollingLoading,
    ]
  );

  const currentError = useMemo(() => {
    if (isStatusError) {
      setIsPollingRestarting(false);
    }

    if (
      (isStatusError && statusError) ||
      (!data?.is_ready_to_interact && uploadedImage)
    ) {
      return {
        message:
          (statusError as any)?.response?.data?.message ||
          "Image is not ready to interact",
        type: "status" as const,
      };
    }
    if (isUploadError && uploadError && uploadedImage) {
      return {
        message:
          (uploadError as any)?.response?.data?.message ||
          "Failed to upload image",
        type: "upload" as const,
      };
    }
    if (
      ((isAnalyzeError && analyzeError) || (!aiResponse && data?.image)) &&
      uploadedImage
    ) {
      return {
        message:
          (analyzeError as any)?.response?.data?.message ||
          "Failed to analyze image",
        type: "analyze" as const,
      };
    }
    if (processingState.error) {
      return {
        message: processingState.error,
        type: processingState.lastFailedOperation || ("unknown" as const),
      };
    }
    return null;
  }, [
    data,
    aiResponse,
    isStatusError,
    statusError,
    isUploadError,
    uploadError,
    isAnalyzeError,
    analyzeError,
    processingState.error,
    processingState.lastFailedOperation,
  ]);

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (!file) return "No file selected";

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Unsupported image format. Only JPEG, PNG, WEBP, and static GIF are allowed.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size too large. Maximum size is 10MB.";
    }

    return null;
  }, []);

  // Check if GIF is animated
  const checkIfAnimatedGif = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.type !== "image/gif") {
        resolve(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer);
        let frameCount = 0;

        for (let i = 0; i < arr.length - 2; i++) {
          if (arr[i] === 0x21 && arr[i + 1] === 0xf9 && arr[i + 2] === 0x04) {
            frameCount++;
            if (frameCount > 1) break;
          }
        }

        resolve(frameCount > 1);
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Enhanced file processing
  const processImageFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setProcessingState({
          isProcessing: false,
          isComplete: false,
          error: validationError,
          lastFailedOperation: null,
        });
        return;
      }

      // Check for animated GIF
      const isAnimated = await checkIfAnimatedGif(file);
      if (isAnimated) {
        setProcessingState({
          isProcessing: false,
          isComplete: false,
          error: "Animated GIFs are not supported. Please upload a static GIF.",
          lastFailedOperation: null,
        });
        return;
      }

      // Store file for retry functionality
      lastUploadedFileRef.current = file;

      setProcessingState({
        isProcessing: true,
        isComplete: false,
        error: null,
        lastFailedOperation: null,
      });

      setFileName(file.name);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target?.result as string);
      reader.onerror = () => {
        setProcessingState({
          isProcessing: false,
          isComplete: false,
          error: "Failed to read image file",
          lastFailedOperation: "upload",
        });
      };
      reader.readAsDataURL(file);

      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", "");
      formData.append("description", "");

      uploadImageContent(
        { strategyId, peerId: data?.id, data: formData },
        {
          onSuccess: (response) => {
            if (response?.imageUrl) {
              setUploadedImage(response.imageUrl);
            }
            // Proceed to analysis
            analyzeImageContent(
              { strategyId, peerId: data?.id },
              {
                onSuccess: () => {
                  setIsPollingRestarting(true);
                  restartPolling(); // Restart polling after successful analysis
                  setProcessingState({
                    isProcessing: false,
                    isComplete: true,
                    error: null,
                    lastFailedOperation: null,
                  });
                },
                onError: () => {
                  setProcessingState({
                    isProcessing: false,
                    isComplete: false,
                    error: null,
                    lastFailedOperation: "analyze",
                  });
                },
              }
            );
          },
          onError: () => {
            setProcessingState({
              isProcessing: false,
              isComplete: false,
              error: null,
              lastFailedOperation: "upload",
            });
          },
        }
      );
    },
    [
      validateFile,
      checkIfAnimatedGif,
      strategyId,
      data,
      uploadImageContent,
      analyzeImageContent,
    ]
  );

  // Retry functionality
  const handleRetry = useCallback(() => {
    if (!currentError) return;

    if (currentError.type === "upload" && lastUploadedFileRef.current) {
      // Retry upload
      processImageFile(lastUploadedFileRef.current);
    } else if (currentError.type === "status" && lastUploadedFileRef.current) {
      // Retry status
      setIsPollingRestarting(true);
      restartPolling();
    } else if (currentError.type === "analyze") {
      // Retry analysis
      setProcessingState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
      }));

      analyzeImageContent(
        { strategyId, peerId: data?.id },
        {
          onSuccess: () => {
            setIsPollingRestarting(true);
            restartPolling();
            setProcessingState({
              isProcessing: false,
              isComplete: true,
              error: null,
              lastFailedOperation: null,
            });
          },
          onError: () => {
            setProcessingState({
              isProcessing: false,
              isComplete: false,
              error: null,
              lastFailedOperation: "analyze",
            });
          },
        }
      );
    }
  }, [currentError, processImageFile, analyzeImageContent, strategyId, data]);

  // Event handlers
  const handleFileSelect = useCallback(
    (file: File) => {
      if (file) {
        processImageFile(file);
      }
    },
    [processImageFile]
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Inside the handleRemoveImage function
  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setFileName("");
    setUserNotes("");
    setAiResponse(null);
    setProcessingState({
      isProcessing: false,
      isComplete: false,
      error: null,
      lastFailedOperation: null,
    });
    updateNodeData(data?.id, {
      image: "",
      title: "",
      ai_notes: "",
      ai_title: "",
      ai_summary: "",
      is_ready_to_interact: false,
    });

    lastUploadedFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (status?.is_ready_to_interact) {
      status.is_ready_to_interact = false;
      status.ai_title = "";
    }

    successNote({
      title: "Image removed",
      description: "Image removed successfully",
    });
    resetPeer(
      { peerId: data?.id, strategyId, peerType: "image" },
      {
        onError: (error: any) => {
          toast({
            title: "Failed to remove Image",
            description:
              error?.response?.data?.message ?? "Something went wrong...",
            variant: "destructive",
          });
        },
      }
    );
  }, [
    data?.id,
    updateNodeData,
    successNote,
    resetPeer,
    strategyId,
    restartPolling,
  ]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragOver) setIsDragOver(true);
    },
    [isDragOver]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Effects
  useEffect(() => {
    // Handle auto-upload from data
    if (data?.dataToAutoUpload?.data) {
      handleFileSelect(data.dataToAutoUpload.data);
    }

    // Handle existing image data
    if (data?.image) {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (apiUrl.endsWith("/api")) apiUrl = apiUrl.replace(/\/api$/, "");

      const imageUrl = data.image.startsWith("http")
        ? data.image
        : apiUrl + data.image;
      setUploadedImage(imageUrl);

      const parts = data.image.split("/");
      setFileName(parts[parts.length - 1] || data.title || "image");
    }

    // Handle AI response data
    if (data?.ai_title || data?.ai_summary) {
      setAiResponse({
        title: data.ai_title || data.title || "",
        peerId: data.id || "",
        analysis: data.ai_summary || "",
        confidence: 0.95,
        tags: [],
      });
    }

    // Handle user notes
    if (data?.ai_notes) {
      setUserNotes(data.ai_notes);
    }

    // Handle completion state
    if (data?.image && data?.is_ready_to_interact) {
      setProcessingState((prev) => ({
        ...prev,
        isComplete: true,
        error: null,
      }));
    }
  }, [data, handleFileSelect]);

  // Remove connections when node becomes not connectable
  useEffect(() => {
    if (!canConnect) {
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id)
      );
    }
  }, [canConnect, id, setEdges]);

  useEffect(() => {
    if (isStatusError) {
      setProcessingState((prev) => ({
        ...prev,
        error: "Status request was rejected, Image is not ready to interact",
        lastFailedOperation: "status",
      }));
    }
  }, [isStatusError]);

  return (
    <NodeWrapper
      id={id}
      type="imageUploadNode"
      strategyId={strategyId}
      className={cn("bg-white", uploadedImage ? "h-[1px]" : "h-[2px]")}
    >
      <div className="relative react-flow__node">
        <div ref={nodeControlRef} className="nodrag" />

        <TooltipProvider>
          <div className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden relative">
            {!uploadedImage ? (
              // Upload Interface
              <div className="relative">
                <div
                  className={cn(
                    "relative bg-white rounded-2xl p-12 transition-all duration-200 border-2 border-dashed cursor-pointer",
                    isDragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300"
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
                    {currentError && currentError?.type === "unknown" && (
                      <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm font-medium flex items-center gap-2">
                        <X className="w-4 h-4 text-red-500" />
                        {currentError.message}
                      </div>
                    )}

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
                      Supports: JPG, PNG, GIF, WebP (Max 10MB)
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
              </div>
            ) : (
              // Processing/Preview Interface
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isProcessingAny ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                          AI is analyzing your image...
                        </span>
                      </div>
                    ) : currentError ? (
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-700">
                          Processing failed
                        </span>
                      </div>
                    ) : aiResponse || status?.ai_title ? (
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium text-gray-700 truncate w-80 text-left">
                              {status?.ai_title || aiResponse?.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {status?.ai_title || aiResponse?.title}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium text-gray-700 truncate text-left">
                              📁 {fileName}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{fileName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isProcessingAny && uploadedImage && (
                      <IsReadyToInteract
                        canConnect={canConnect}
                        isLoading={isStatusPollingLoading}
                      />
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
                      className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 z-10"
                      disabled={isProcessingAny || isResetting}
                    >
                      {isResetting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>

                    {/* Processing Overlay */}
                    {isProcessingAny && (
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

                {/* Error State with Retry */}
                {!isProcessingAny && currentError && (
                  <div className="px-4">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-red-600 font-medium mb-1 capitalize">
                        {currentError?.type} Error
                      </div>
                      <div className="text-sm text-red-700 mb-2">
                        {currentError.message}
                      </div>
                      <Button
                        onClick={handleRetry}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                        disabled={isProcessingAny}
                      >
                        {isProcessingAny ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Retry Processing
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes Input */}
                <div className="px-4 pb-4">
                  <AiNoteInput
                    color="blue"
                    note={userNotes}
                    readOnly={!canConnect}
                    hideButton={!canConnect}
                    isLoading={isAnalyzing || isStatusPollingLoading}
                    setNote={(val) => setUserNotes(val ?? "")}
                    isInputDisabled={isProcessingAny}
                    isButtonDisabled={isProcessingAny}
                    strategyId={strategyId}
                    peerId={data?.id}
                    peerType="image"
                  />
                </div>
              </div>
            )}
          </div>
        </TooltipProvider>

        <NodeHandle
          type="source"
          canConnect={canConnect}
          position={sourcePosition}
        />
      </div>
    </NodeWrapper>
  );
}
