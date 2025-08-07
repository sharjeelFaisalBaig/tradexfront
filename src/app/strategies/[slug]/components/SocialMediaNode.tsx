"use client";
import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  useMemo,
  useCallback,
} from "react";
import {
  useAnalyzeSocialPeer,
  useResetPeer,
} from "@/hooks/strategy/useStrategyMutations";
import { Position, useReactFlow } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ArrowRight, Loader2, ExternalLink } from "lucide-react";
import {
  cn,
  extractSocialVideoDetails,
  validateSocialMediaUrl,
  SUPPORTED_PLATFORMS,
  preventNodeDeletionKeys,
} from "@/lib/utils";
import NodeWrapper from "./common/NodeWrapper";
import { useParams } from "next/navigation";
import { useGetPeerAnalysisStatus } from "@/hooks/strategy/useGetPeerAnalysisStatus";
import { toast } from "@/hooks/use-toast";
import type { SocialMediaData, URLValidationResult } from "@/lib/utils";
import { getEmbedVideoByLink } from "@/hooks/useGetEmbedVideoByLink";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import NodeHandle from "./common/NodeHandle";
import AiNoteInput from "./common/AiNoteInput";
import IsReadyToInteract from "./common/IsReadyToInteract";

interface AIProcessingResponse {
  title: string;
  peerId: string;
  description: string;
  transcript: string;
  keyTopics: string[];
  sentiment: string;
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  metadata: {
    duration: string;
    platform: string;
    author: string;
    publishedAt: string;
    language: string;
  };
  confidence: number;
  tags: string[];
  insights: string[];
}

interface ProcessingState {
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
  lastFailedOperation: "analyze" | null;
}

export default function SocialMediaNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: any) {
  const strategyId = useParams()?.slug as string;
  const nodeControlRef = useRef(null);
  const isAutoUploadProcessedRef = useRef(false);

  const { setEdges, updateNodeData } = useReactFlow();
  const successNote = useSuccessNotifier();
  const [socialUrl, setSocialUrl] = useState<string>("");
  const [urlValidation, setUrlValidation] = useState<URLValidationResult>({
    isValid: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [socialMediaData, setSocialMediaData] =
    useState<SocialMediaData | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isComplete: false,
    error: null,
    lastFailedOperation: null,
  });
  const [aiResponse, setAiResponse] = useState<AIProcessingResponse | null>(
    null
  );
  const [userNotes, setUserNotes] = useState<string>("");
  const processUrlCalledRef = useRef(false);

  const { mutate: resetPeer, isPending: isReseting } = useResetPeer();
  const {
    mutate: analyzeSocialPeer,
    error: analyzeError,
    data: analyzeData,
    reset: resetAnalyze,
    isPending: isAnalyzing,
    isSuccess: isAnalyzeSuccess,
    isError: isAnalyzeError,
  } = useAnalyzeSocialPeer();

  const {
    data: status,
    restartPolling,
    error: statusError,
    isError: isStatusError,
    isPollingLoading: isStatusPollingLoading,
  } = useGetPeerAnalysisStatus({
    peerId: id,
    strategyId,
    peerType: "social_media",
    enabled: isAnalyzeSuccess,
  });

  useEffect(() => {
    if (data?.video) {
      const validation = validateSocialMediaUrl(data.video);
      setSocialUrl(data.video);
      setUrlValidation(validation);
      if (validation.isValid) {
        const extractedData = extractSocialVideoDetails(data.video);
        setSocialMediaData(extractedData);
      } else {
        setSocialMediaData(null);
      }
      if (data.ai_title || data.ai_summary) {
        setAiResponse({
          title: data.ai_title || data.title || "",
          peerId: data.id || "",
          description: data.ai_summary || "",
          transcript: data.transcript || "",
          keyTopics: data.keyTopics || [],
          sentiment: data.sentiment || "neutral",
          engagement: data.engagement || {},
          metadata: data.metadata || {},
          confidence: 0.95,
          tags: [],
          insights: data.insights || [],
        });
      } else {
        setAiResponse(null);
      }
      setUserNotes(data.ai_notes || "");
      if (data.is_ready_to_interact) {
        setProcessingState((prev) => ({
          ...prev,
          isComplete: true,
          error: null,
        }));
      } else {
        setProcessingState((prev) => ({
          ...prev,
          isComplete: false,
        }));
      }
      // } else if (data?.dataToAutoUpload?.data && !processUrlCalledRef.current) {
      //   const validation = validateSocialMediaUrl(data?.dataToAutoUpload?.data);
      //   setSocialUrl(data?.dataToAutoUpload?.data);
      //   setUrlValidation(validation);
      //   if (validation.isValid) {
      //     console.log("Valid URL:", data?.dataToAutoUpload?.data);
      //     handleProcessUrl(data?.dataToAutoUpload?.data);
      //     processUrlCalledRef.current = true;
      //   } else {
      //     console.error("Invalid URL:", data?.dataToAutoUpload?.data);
      //   }
      //   setSocialMediaData(null);
      //   setAiResponse(null);
      //   setProcessingState({
      //     isProcessing: false,
      //     isComplete: false,
      //     error: null,
      //     lastFailedOperation: null,
      //   });
      //   setUserNotes("");
    }
  }, [data]);

  useEffect(() => {
    if (data?.dataToAutoUpload?.data && !isAutoUploadProcessedRef.current) {
      const validation = validateSocialMediaUrl(data?.dataToAutoUpload?.data);
      setSocialUrl(data?.dataToAutoUpload?.data);
      setUrlValidation(validation);
      if (validation.isValid) {
        console.log("Valid URL:", data?.dataToAutoUpload?.data);
        handleProcessUrl(data?.dataToAutoUpload?.data);
      } else {
        console.error("Invalid URL:", data?.dataToAutoUpload?.data);
      }
      isAutoUploadProcessedRef.current = true;
    }
  }, [data]);

  useEffect(() => {
    if (isAnalyzeSuccess && analyzeData) {
      setProcessingState({
        isProcessing: false,
        isComplete: true,
        error: null,
        lastFailedOperation: null,
      });
      setAiResponse(analyzeData);
    }
  }, [isAnalyzeSuccess, analyzeData]);

  useEffect(() => {
    if (analyzeError) {
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: analyzeError.message || "Processing failed.",
        lastFailedOperation: "analyze",
      });
    }
  }, [analyzeError]);

  useEffect(() => {
    if (status?.is_ready_to_interact) {
      setProcessingState({
        isProcessing: false,
        isComplete: true,
        error: null,
        lastFailedOperation: null,
      });
    }
  }, [status]);

  const handleUrlValidation = (url: string) => {
    setUrlValidation(validateSocialMediaUrl(url));
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setSocialUrl(url);
    handleUrlValidation(url);
  };

  const handleProcessUrl = async (socialUrlParameter?: string) => {
    const urlToUse = socialUrlParameter ?? socialUrl;
    const validation = validateSocialMediaUrl(urlToUse);

    if (!validation.isValid || !validation.platform) {
      console.error("URL is not valid or platform is not supported");
      return;
    }

    setIsLoading(true);
    setProcessingState({
      isProcessing: true,
      isComplete: false,
      error: null,
      lastFailedOperation: null,
    });
    setAiResponse(null);
    setSocialMediaData(null);
    resetAnalyze();

    try {
      console.log("Processing URL:", urlToUse);
      const videoData = extractSocialVideoDetails(urlToUse);
      console.log("Extracted video data:", videoData);

      if (videoData) {
        console.log("Setting social media data:", videoData);
        setSocialMediaData(videoData);
      } else {
        throw new Error("Could not extract video details.");
      }

      analyzeSocialPeer({
        strategyId,
        peerId: id,
        data: {
          source_url: urlToUse,
          ai_notes: userNotes,
        },
      });
    } catch (error: any) {
      console.error("Error processing URL:", error);
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: error.message || "Failed to process URL. Please try again.",
        lastFailedOperation: "analyze",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    resetAnalyze();
    setSocialUrl("");
    setSocialMediaData(null);
    setUrlValidation({ isValid: false });
    setAiResponse(null);
    setProcessingState({
      isProcessing: false,
      isComplete: false,
      error: null,
      lastFailedOperation: null,
    });
    setUserNotes("");
    setIsLoading(false);
    updateNodeData(id, {
      video: "",
      title: "",
      ai_notes: "",
      ai_title: "",
      ai_summar: "",
      is_ready_to_interact: false,
    });
    if (data?.is_ready_to_interact) {
      data.is_ready_to_interact = false;
      data.ai_title = "";
      data.ai_notes = "";
      data.title = "";
      data.video = "";
      data.ai_summar = "";
    }
    if (status?.is_ready_to_interact) {
      status.is_ready_to_interact = false;
      status.ai_title = "";
    }
    successNote({
      title: "Social media link removed",
      description: "Social media link removed successfully",
    });
    resetPeer(
      { peerId: data?.id, strategyId, peerType: "social_media" },
      {
        onError: (error: any) => {
          toast({
            title: "Failed to remove social media link",
            description:
              error?.response?.data?.message ?? "Something went wrong...",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleReprocess = () => {
    if (socialMediaData) handleProcessUrl();
  };

  const handleOpenOriginal = () => {
    if (socialMediaData) {
      window.open(socialMediaData.url, "_blank", "noopener,noreferrer");
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const isProcessingAny = useMemo(
    () => isAnalyzing || processingState.isProcessing || isStatusPollingLoading,
    [isAnalyzing, processingState.isProcessing, isStatusPollingLoading]
  );

  const currentError = useMemo(() => {
    if (
      (isStatusError && statusError) ||
      (data?.video && !data?.is_ready_to_interact)
    ) {
      return {
        message:
          (statusError as any)?.response?.data?.message ||
          "Image is not ready to interact",
        type: "analyze" as const,
      };
    }
    if (isAnalyzeError && analyzeError) {
      return {
        message:
          (analyzeError as any)?.response?.data?.message || "Failed to analyze",
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
    statusError,
    isStatusError,
    isAnalyzeError,
    analyzeError,
    processingState.error,
    processingState.lastFailedOperation,
  ]);

  const handleRetry = useCallback(() => {
    if (!currentError) return;
    if (currentError.type === "analyze") {
      handleReprocess();
    }
  }, [currentError, handleReprocess]);

  const currentPlatform = useMemo(
    () =>
      socialMediaData
        ? SUPPORTED_PLATFORMS[
            socialMediaData.platform as keyof typeof SUPPORTED_PLATFORMS
          ]
        : null,
    [socialMediaData]
  );

  const canConnect = useMemo(
    () =>
      !isReseting &&
      (data?.is_ready_to_interact || status?.is_ready_to_interact),
    [data?.is_ready_to_interact, status?.is_ready_to_interact, isReseting]
  );

  useEffect(() => {
    if (!canConnect) {
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id)
      );
    }
  }, [canConnect, id, setEdges, data]);

  console.log({ socialMediaData });

  return (
    <>
      <NodeWrapper
        id={id}
        strategyId={strategyId}
        type="socialMediaNode"
        className={cn("bg-white", socialMediaData ? "h-[1px]" : "h-[2px]")}
      >
        <div className="react-flow__node" onKeyDown={preventNodeDeletionKeys}>
          <div ref={nodeControlRef} className={`nodrag`} />
          <TooltipProvider>
            <div
              className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden relative"
              onWheel={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {!socialMediaData ? (
                <div className="p-6 space-y-4 py-4">
                  <div className="text-center mb-6">
                    <div className="flex justify-center space-x-2 mb-4">
                      {Object.values(SUPPORTED_PLATFORMS).map(
                        (platform, index) => (
                          <div key={index} className="text-2xl">
                            {platform.icon}
                          </div>
                        )
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {"Add Social Media Video"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {"Enter a URL from YouTube or TikTok"}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type="url"
                        placeholder="https://www.youtube.com/example..."
                        value={socialUrl}
                        onChange={handleUrlChange}
                        className={cn(
                          "pr-12",
                          urlValidation.isValid
                            ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                            : urlValidation.error
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        )}
                        onWheel={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                      {urlValidation.isValid && urlValidation.platform && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div
                            className={cn(
                              "text-xs px-2 py-1 rounded-full font-medium",
                              `bg-gradient-to-r ${
                                SUPPORTED_PLATFORMS[
                                  urlValidation.platform as keyof typeof SUPPORTED_PLATFORMS
                                ].color
                              } text-white`
                            )}
                          >
                            {
                              SUPPORTED_PLATFORMS[
                                urlValidation.platform as keyof typeof SUPPORTED_PLATFORMS
                              ].name
                            }
                          </div>
                        </div>
                      )}
                    </div>
                    {urlValidation.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {urlValidation.error}
                      </div>
                    )}
                    {urlValidation.warning && (
                      <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                        {urlValidation.warning}
                      </div>
                    )}
                    <Button
                      onClick={() => handleProcessUrl()}
                      disabled={!urlValidation.isValid || isLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      {isLoading || isProcessingAny ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {"Processing URL..."}
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4 mr-2" />
                          {"Process Video"}
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="font-medium">Supported platforms:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(SUPPORTED_PLATFORMS).map(
                        (platform, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span>{platform.icon}</span>
                            <span>{platform.name}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={cn(
                      "w-full px-4 py-3 flex items-center justify-between",
                      currentPlatform
                        ? `bg-gradient-to-r ${currentPlatform.color} text-white`
                        : "bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isProcessingAny ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">
                            AI is analyzing your video...
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
                          <span className="text-lg">
                            {currentPlatform?.icon}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium truncate w-80 text-left">
                                {status?.ai_title ||
                                  data?.ai_title ||
                                  aiResponse.title}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">
                                {status?.ai_title ||
                                  data?.ai_title ||
                                  aiResponse.title}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {currentPlatform?.icon}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium truncate w-80 text-left">
                                {socialMediaData.title}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">{socialMediaData.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isProcessingAny && socialMediaData && (
                        <IsReadyToInteract
                          canConnect={canConnect}
                          isLoading={isStatusPollingLoading}
                        />
                      )}
                    </div>
                  </div>
                  <div className="px-4">
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                      <div className="relative w-full h-full aspect-video overflow-hidden">
                        {socialMediaData &&
                          getEmbedVideoByLink(
                            socialMediaData.platform,
                            socialMediaData.url
                          )}
                      </div>
                      {isProcessingAny && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                              {"Processing..."}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="my-4 flex flex-col gap-y-3">
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleOpenOriginal}
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-transparent"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              {"Open Original"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {"View on "}
                              {currentPlatform?.name}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        <Button
                          onClick={handleReset}
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          disabled={isProcessingAny || isReseting}
                        >
                          {isReseting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {!currentError?.message &&
                        !isStatusPollingLoading &&
                        !isProcessingAny &&
                        !canConnect && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="text-xs text-red-600 font-medium mb-1">
                              Processing Error
                            </div>
                            <div className="text-sm text-red-700 mb-2">
                              Video is not ready to interact
                            </div>
                            <Button
                              onClick={handleReprocess}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                            >
                              {"Retry Processing"}
                            </Button>
                          </div>
                        )}
                      <AiNoteInput
                        color="blue"
                        note={userNotes}
                        setNote={(val) => setUserNotes(val ?? "")}
                        strategyId={strategyId}
                        peerId={data?.id}
                        peerType="social_media"
                        isDisabled={
                          !canConnect ||
                          isAnalyzing ||
                          isProcessingAny ||
                          isStatusPollingLoading
                        }
                      />
                    </div>
                  </div>
                  {!isProcessingAny && currentError && (
                    <div className="px-4 pb-4">
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
                        >
                          {"Retry Processing"}
                        </Button>
                      </div>
                    </div>
                  )}
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
