"use client";

import {
  useState,
  useRef,
  useEffect,
  type DragEvent,
  type ChangeEvent,
  useMemo,
} from "react";
import { Position, useReactFlow } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { X, Plus, Upload, Lightbulb, Loader2 } from "lucide-react";
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
  // console.log("ImageUploadNode data:", data);

  const strategyId = useParams()?.slug as string;

  const successNote = useSuccessNotifier();

  const { mutate: resetPeer, isPending: isReseting } = useResetPeer();
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

  const nodeControlRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setEdges, updateNodeData } = useReactFlow();

  // Image states
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // AI Response states
  const [userNotes, setUserNotes] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<AIProcessingResponse | null>(
    null
  );

  // Processing states
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isComplete: false,
    error: "",
  });

  // Only poll for status if analysis is successful
  const { data: status, isPollingLoading: isStatusPollingLoading } =
    useGetPeerAnalysisStatus({
      peerId: data?.id,
      strategyId,
      peerType: "image",
      enabled: isAnalyzeSuccess,
    });

  // Sync state with incoming data props (like VideoUploadNode)
  useEffect(() => {
    // upload pasted image if exists
    if (data?.dataToAutoUpload?.data) {
      handleFileSelect(data?.dataToAutoUpload?.data);
    }

    // Handle image from data.image (relative or absolute path)
    if (data?.image) {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (apiUrl.endsWith("/api")) apiUrl = apiUrl.replace(/\/api$/, "");
      const imageUrl = data.image.startsWith("http")
        ? data.image
        : apiUrl + data.image;
      setUploadedImage(imageUrl);
      // Extract file name from path or use data.title
      const parts = data.image.split("/");
      setFileName(parts[parts.length - 1] || data.title || "image");
    }

    // If backend provides AI info, set it
    if (data?.ai_title || data?.ai_summary) {
      setAiResponse({
        title: data.ai_title || data.title || "",
        peerId: data.id || "",
        analysis: data.ai_summary || "",
        confidence: 0.95, // fallback
        tags: [], // fallback
      });
    }

    // Set user notes if present
    if (data?.ai_notes) {
      setUserNotes(data.ai_notes);
    }

    // If image is present, mark processing as complete (for connectability)
    if (data?.image && data?.is_ready_to_interact) {
      setProcessingState((prev) => ({
        ...prev,
        isComplete: true,
        error: null,
      }));
    }
  }, [data]);

  const handleFileSelect = (file: File) => {
    // Supported formats: JPEG, PNG, WEBP, GIF (static only)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error:
          "Unsupported image format. Only JPEG, PNG, WEBP, and static GIF are allowed.",
      });
      return;
    }
    // For GIF, check if it's animated (static only allowed)
    if (file.type === "image/gif") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer);
        // Look for multiple GIF frames (0x21, 0xF9, 0x04)
        let frameCount = 0;
        for (let i = 0; i < arr.length - 2; i++) {
          if (arr[i] === 0x21 && arr[i + 1] === 0xf9 && arr[i + 2] === 0x04) {
            frameCount++;
            if (frameCount > 1) break;
          }
        }
        if (frameCount > 1) {
          setProcessingState({
            isProcessing: false,
            isComplete: false,
            error:
              "Animated GIFs are not supported. Please upload a static GIF.",
          });
          return;
        }
        // If static GIF, continue as normal
        proceedWithImage(file);
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    proceedWithImage(file);
  };

  // Helper to handle valid image
  const proceedWithImage = (file: File) => {
    console.log("proceedWithImage FUnction called...!");

    setProcessingState({
      isProcessing: true,
      isComplete: false,
      error: null,
    });

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.onerror = () =>
      setProcessingState(() => ({
        isProcessing: false,
        isComplete: false,
        error: "Failed to read image file",
      }));
    reader.onabort = () =>
      setProcessingState(() => ({
        isProcessing: false,
        isComplete: false,
        error: "Image reading aborted",
      }));
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", "");
    formData.append("description", "");

    const handleError = (message: string, error: any) => {
      console.log("handleError called");

      setProcessingState(() => ({
        isProcessing: false,
        isComplete: false,
        error: error?.response?.data?.message || message,
      }));
    };

    uploadImageContent(
      { strategyId, peerId: data?.id, data: formData },
      {
        onSuccess: (response) => {
          if (response?.imageUrl) setUploadedImage(response.imageUrl);

          analyzeImageContent(
            { strategyId, peerId: data?.id, data: { ai_notes: userNotes } },
            {
              onSuccess: () =>
                setProcessingState(() => ({
                  isProcessing: false,
                  isComplete: true,
                  error: null,
                })),
              onError: (error) => handleError("Failed to analyze image", error),
            }
          );
        },
        onError: (error) => handleError("Failed to upload image", error),
      }
    );
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
    setUserNotes("");
    setAiResponse(null);
    setProcessingState({
      isProcessing: false,
      isComplete: false,
      error: null,
    });

    updateNodeData(data?.id, {
      image: "",
      title: "",
      ai_notes: "",
      ai_title: "",
      is_ready_to_interact: false, // Set to false immediately
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (data?.is_ready_to_interact) {
      data.is_ready_to_interact = false;
      data.ai_title = "";
      data.ai_notes = "";
      data.title = "";
      data.image = "";
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
  };

  // If data has imageUrl and is_ready_to_interact, show image and allow connect
  useEffect(() => {
    if (data?.imageUrl) {
      setUploadedImage(data.imageUrl);
      setFileName(data.fileName || "");
    }
  }, [data?.imageUrl, data?.fileName]);

  // Modified canConnect to immediately reflect isReseting state
  const canConnect = useMemo(
    () =>
      !isReseting &&
      (data?.is_ready_to_interact || status?.is_ready_to_interact),
    [data?.is_ready_to_interact, status?.is_ready_to_interact, isReseting]
  );

  // Remove connections when node becomes not connectable
  useEffect(() => {
    if (!canConnect) {
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id)
      );
    }
  }, [canConnect, id, setEdges, data]);

  // dont remove it
  //  // on call
  //   setProcessingState({
  //     isProcessing: true,
  //     isComplete: false,
  //     error: null,
  //   });
  //   // on success
  //   setProcessingState({
  //     isProcessing: false,
  //     isComplete: true,
  //     error: null,
  //   });
  //   // on error
  //   setProcessingState({
  //     isProcessing: false,
  //     isComplete: false,
  //     error: error instanceof Error ? error.message : "Processing failed",
  //   });

  console.log({ processingState, isAnalyzeError, analyzeError, uploadError });

  return (
    <>
      <NodeWrapper
        id={id}
        type="imageUploadNode"
        strategyId={strategyId}
        className={cn("bg-white", uploadedImage ? "h-[1px]" : "h-[2px]")}
      >
        <div className="relative react-flow__node">
          <div ref={nodeControlRef} className={`nodrag`} />

          <TooltipProvider>
            <div className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden relative">
              {!uploadedImage ? (
                // Upload Interface
                <div className="relative">
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
                      {/* Show error message if unsupported format or other error and no image uploaded */}
                      {processingState.error && (
                        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm font-medium flex items-center gap-2">
                          <X className="w-4 h-4 text-red-500" />
                          {processingState.error}
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium text-gray-700 truncate w-80 text-left">
                                {status?.ai_title || aiResponse.title}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">
                                {status?.ai_title || aiResponse.title}
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
                      {!processingState.isProcessing && uploadedImage && (
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
                        className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                        disabled={processingState.isProcessing || isReseting}
                      >
                        {isReseting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
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
                  {(isAnalyzeError || isUploadError) && (
                    <div className="px-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-xs text-red-600 font-medium mb-1">
                          Processing Error
                        </div>
                        <div className="text-sm text-red-700 mb-2">
                          {isAnalyzeError
                            ? // @ts-ignore
                              analyzeError?.response?.data?.message
                            : ""}
                          {isUploadError
                            ? // @ts-ignore
                              uploadError?.response?.data?.message
                            : ""}
                        </div>
                        <Button
                          onClick={() => {
                            if (isUploadError) {
                            }
                            if (isAnalyzeError) {
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                        >
                          Retry Processing
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* {processingState.error && (
                    <div className="px-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-xs text-red-600 font-medium mb-1">
                          Processing Error
                        </div>
                        <div className="text-sm text-red-700 mb-2">
                          {processingState.error}
                        </div>
                        <Button
                          onClick={() => {
                            if (isUploadError) {
                            }
                            if (isAnalyzeError) {
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                        >
                          Retry Processing
                        </Button>
                      </div>
                    </div>
                  )} */}

                  {/* Notes Input */}
                  <div className="px-4 pb-4">
                    <AiNoteInput
                      color="blue"
                      note={userNotes}
                      // readOnly={canConnect}
                      // hideButton={canConnect}
                      isLoading={isAnalyzing || isStatusPollingLoading}
                      setNote={(val) => setUserNotes(val ?? "")}
                      isInputDisabled={processingState.isProcessing}
                      isButtonDisabled={
                        processingState.isProcessing || isAnalyzing
                      }
                      onButtonClick={() => {
                        analyzeImageContent({
                          data: { ai_notes: userNotes },
                          strategyId: strategyId,
                          peerId: data?.id,
                        });
                      }}
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
    </>
  );
}
