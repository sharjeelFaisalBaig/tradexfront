"use client";
import { useState, useRef, useEffect, type ChangeEvent, useMemo } from "react";
import {
  useAnalyzeSocialPeer,
  useResetPeer,
} from "@/hooks/strategy/useStrategyMutations";
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
  ArrowRight,
  HelpCircle,
  Loader2,
  Shield,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import {
  cn,
  extractSocialVideoDetails,
  validateSocialMediaUrl,
  SUPPORTED_PLATFORMS,
} from "@/lib/utils"; // Import updated helpers
import NodeWrapper from "./common/NodeWrapper";
import { useParams } from "next/navigation";
import { useGetPeerAnalysisStatus } from "@/hooks/strategy/useGetPeerAnalysisStatus";
import { toast } from "@/hooks/use-toast";

// Types for AI integration
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
}

// Re-import SocialMediaData and URLValidationResult types if they are exported from utils.ts
import type { SocialMediaData, URLValidationResult } from "@/lib/utils";
import { getEmbedVideoByLink } from "@/hooks/useGetEmbedVideoByLink";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

export default function SocialMediaNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: any) {
  // console.log("SocialMediaNode data:", { data });

  const strategyId = useParams()?.slug as string;
  const nodeControlRef = useRef(null);
  const { setEdges } = useReactFlow();
  const successNote = useSuccessNotifier();

  // URL and validation states
  const [socialUrl, setSocialUrl] = useState<string>("");
  const [urlValidation, setUrlValidation] = useState<URLValidationResult>({
    isValid: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Video data states
  const [socialMediaData, setSocialMediaData] =
    useState<SocialMediaData | null>(null);

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

  // Sync state with incoming data props (like VideoUploadNode)
  useEffect(() => {
    if (data && data?.video) {
      const validation = validateSocialMediaUrl(data.video);
      setSocialUrl(data.video);
      setUrlValidation(validation);
      if (validation.isValid) {
        // Use the new helper to extract details including initial thumbnail
        const extractedData = extractSocialVideoDetails(data.video);
        setSocialMediaData(extractedData);
      } else {
        setSocialMediaData(null);
      }
      // Set AI response if present
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
          confidence: 0.95, // fallback
          tags: [], // fallback
          insights: data.insights || [],
        });
      } else {
        setAiResponse(null);
      }
      // Set user notes if present
      setUserNotes(data.ai_notes || "");
      // If video is present and ready, mark processing as complete (for connectability)
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
    } else {
      // If no data or no video, reset to pre-upload state
      if (data?.dataToAutoUpload?.data) {
        const validation = validateSocialMediaUrl(data?.dataToAutoUpload?.data);
        setSocialUrl(data?.dataToAutoUpload?.data);
        setUrlValidation(validation);
      } else {
        setSocialUrl("");
        setUrlValidation({ isValid: false });
      }

      setSocialMediaData(null);
      setAiResponse(null);
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: null,
      });
      setUserNotes("");
    }
  }, [data]);

  // --- Mutation Integration & Polling ---
  const { mutate: resetPeer, isPending: isReseting } = useResetPeer();
  const {
    mutate: analyzeSocialPeer,
    error: analyzeError,
    data: analyzeData,
    reset: resetAnalyze,
    isPending: isAnalyzing,
    isSuccess: isAnalyzeSuccess,
  } = useAnalyzeSocialPeer();

  // Only poll for status if analysis is successful
  const { data: status, isPollingLoading: isStatusPollingLoading } =
    useGetPeerAnalysisStatus({
      peerId: id,
      strategyId,
      peerType: "social_media",
      enabled: isAnalyzeSuccess,
    });

  // Set processing state and AI response on successful analysis
  useEffect(() => {
    if (isAnalyzeSuccess && analyzeData) {
      setProcessingState({
        isProcessing: false,
        isComplete: true,
        error: null,
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
      });
    }
  }, [analyzeError]);

  // Validate URL and update state
  const handleUrlValidation = (url: string) => {
    setUrlValidation(validateSocialMediaUrl(url));
  };

  // Handle URL input change [^1]
  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setSocialUrl(url);
    handleUrlValidation(url);
  };

  // Process the provided URL
  const handleProcessUrl = async () => {
    if (!urlValidation.isValid || !urlValidation.platform) return;
    setIsLoading(true);
    setProcessingState({ isProcessing: true, isComplete: false, error: null });
    setAiResponse(null);
    setSocialMediaData(null); // Reset socialMediaData before processing
    resetAnalyze();
    try {
      const videoData = extractSocialVideoDetails(socialUrl); // Use the new helper
      if (videoData) {
        setSocialMediaData(videoData);
      } else {
        throw new Error("Could not extract video details.");
      }
      // Initial analyze request (no polling, just one request)
      analyzeSocialPeer({
        strategyId,
        peerId: id,
        data: {
          source_url: socialUrl,
          ai_notes: userNotes,
        },
      });
    } catch (error: any) {
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: error.message || "Failed to process URL. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset all states
  const handleReset = () => {
    resetPeer(
      { peerId: data?.id, strategyId, peerType: "social_media" },
      {
        onSuccess: (data) => {
          setSocialUrl("");
          setSocialMediaData(null);
          setUrlValidation({ isValid: false });
          setAiResponse(null);
          setProcessingState({
            isProcessing: false,
            isComplete: false,
            error: null,
          });
          setUserNotes("");
          setIsLoading(false);
          successNote({
            title: "Social media link removed",
            description:
              data?.message ?? "Social media link removed successfully",
          });
        },
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

  // Handle notes input change
  const handleNotesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserNotes(e.target.value);
  };

  // Retry processing
  const handleReprocess = () => {
    if (socialMediaData) handleProcessUrl();
  };

  // Open original video in new tab
  const handleOpenOriginal = () => {
    if (socialMediaData) {
      window.open(socialMediaData.url, "_blank", "noopener,noreferrer");
    }
  };

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Allow connection if processing is complete and no error
  // const canConnect = (processingState.isComplete && !processingState.error) || data?.is_ready_to_interact;
  const canConnect = useMemo(
    () => data?.is_ready_to_interact || status?.is_ready_to_interact,
    [data, status]
  );

  // Remove connections if node is not connectable
  useEffect(() => {
    if (!canConnect) {
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id)
      );
    }
  }, [canConnect, id, setEdges]);

  // Update processing state if backend status is ready
  useEffect(() => {
    if (status?.is_ready_to_interact) {
      setProcessingState({
        isProcessing: false,
        isComplete: true,
        error: null,
      });
    }
  }, [status]);

  // Memoize current platform config
  const currentPlatform = useMemo(
    () =>
      socialMediaData
        ? SUPPORTED_PLATFORMS[
            socialMediaData.platform as keyof typeof SUPPORTED_PLATFORMS
          ]
        : null,
    [socialMediaData]
  );

  return (
    <>
      <NodeWrapper
        id={id}
        strategyId={strategyId}
        type="socialMediaNode"
        className={cn("bg-white", socialMediaData ? "h-[1px]" : "h-[2px]")}
      >
        <div className="react-flow__node">
          <div ref={nodeControlRef} className={`nodrag`} />
          <TooltipProvider>
            <div
              className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden relative"
              onWheel={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {!socialMediaData ? (
                // URL Input Interface
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
                      {
                        "Enter a URL from Instagram, YouTube, TikTok, or Facebook"
                      }
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type="url"
                        placeholder="https://www.instagram.com/p/example..."
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
                    {/* Notes input directly below URL input */}
                    <div className="relative">
                      <Input
                        placeholder="Add notes for AI to use..."
                        value={userNotes}
                        onChange={handleNotesChange}
                        className="pr-8 border-gray-200 focus:border-purple-500 focus:ring-purple-500 mt-2"
                        disabled={processingState.isProcessing}
                        onWheel={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
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
                            {
                              "Add notes that will be used by AI to provide better context and insights"
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
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
                      onClick={handleProcessUrl}
                      disabled={!urlValidation.isValid || isLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      {isLoading || isAnalyzing ? (
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
                // Video Preview Interface
                <div className="space-y-4">
                  {/* Header with AI Title or Processing State */}
                  <div
                    className={cn(
                      "w-full px-4 py-3 flex items-center justify-between",
                      currentPlatform
                        ? `bg-gradient-to-r ${currentPlatform.color} text-white`
                        : "bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {processingState.isProcessing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">
                            {"AI is analyzing your video..."}
                          </span>
                        </div>
                      ) : processingState.error ? (
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">
                            {"Processing failed"}
                          </span>
                        </div>
                      ) : aiResponse ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {currentPlatform?.icon}
                          </span>
                          <span className="text-sm font-medium truncate">
                            {data?.ai_title || aiResponse.title}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {currentPlatform?.icon}
                          </span>
                          <span className="text-sm font-medium truncate">
                            {socialMediaData.title}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isStatusPollingLoading && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Preparing to connect...</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {canConnect && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CheckCircle className="w-4 h-4 text-green-300" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {"Ready to connect to other nodes"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {!canConnect &&
                        !isStatusPollingLoading &&
                        !processingState.isProcessing &&
                        socialMediaData && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Shield className="w-4 h-4 text-yellow-300" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">
                                {"Complete analysis to enable connections"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                    </div>
                  </div>
                  {/* Video Preview */}
                  <div className="px-4">
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                      {/*
                        WARNING: Directly using <video> tag with social media URLs (like YouTube, Instagram, TikTok, Facebook)
                        will likely NOT work as these are typically page URLs, not direct video file links.
                        Social media platforms require their own embed players (usually iframes) for proper embedding.
                        If you need to embed the actual video, consider using platform-specific iframe embeds.
                      */}

                      <div className="relative w-full h-full aspect-video overflow-hidden">
                        {socialMediaData &&
                          getEmbedVideoByLink(
                            socialMediaData.platform,
                            socialMediaData.url
                          )}
                      </div>

                      {processingState.isProcessing && (
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
                    {/* Video metadata */}
                    <div className="my-4 space-y-3">
                      {/* Action buttons */}
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
                          disabled={processingState.isProcessing || isReseting}
                        >
                          {isReseting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Error State */}
                  {processingState.error && (
                    <div className="px-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-xs text-red-600 font-medium mb-1">
                          {"Processing Error"}
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
                          {"Retry Processing"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TooltipProvider>
          <Handle
            position={sourcePosition}
            type="source"
            isConnectableEnd={canConnect}
            isConnectable={canConnect}
            isConnectableStart={canConnect}
            style={{ width: "30px", height: "30px" }}
          />
        </div>
      </NodeWrapper>
    </>
  );
}
