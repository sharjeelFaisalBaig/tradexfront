"use client";

import type React from "react";

import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  useMemo,
  useCallback,
} from "react";
import { Position, useReactFlow } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Globe,
  ExternalLink,
  X,
  Lightbulb,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  ArrowRight,
} from "lucide-react";
import { cn, preventNodeDeletionKeys } from "@/lib/utils";
import NodeWrapper from "./common/NodeWrapper";
import { useParams } from "next/navigation";
import {
  useAnalyzeRemotePeer,
  useResetPeer,
} from "@/hooks/strategy/useStrategyMutations";
import { useGetPeerAnalysisStatus } from "@/hooks/strategy/useGetPeerAnalysisStatus";
import { toast } from "@/hooks/use-toast";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import AiNoteInput from "./common/AiNoteInput";
import NodeHandle from "./common/NodeHandle";
import IsReadyToInteract from "./common/IsReadyToInteract";

// Types for AI integration
interface AIProcessingResponse {
  title: string;
  peerId: string;
  summary: string;
  keyPoints: string[];
  sentiment: string;
  confidence: number;
  tags: string[];
  wordCount: number;
  language: string;
  contentType: string;
}

interface ProcessingState {
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
  lastFailedOperation: "analyze" | null;
}

interface WebsiteData {
  url: string;
  title: string;
  content: string;
  favicon: string;
  screenshot: string;
}

interface URLValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export default function RemoteNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: any) {
  // console.log("RemoteNode data:", { data });

  const strategyId = useParams()?.slug as string;
  const successNote = useSuccessNotifier();

  // mutations
  const { mutate: resetPeer, isPending: isReseting } = useResetPeer();
  const {
    mutate: analyzeRemotePeer,
    isPending: isAnalyzing,
    isError: isAnalyzeError,
    error: analyzeError,
    isSuccess: isAnalyzeSuccess,
    reset: resetAnalyzeRemotePeerMutation,
  } = useAnalyzeRemotePeer();

  // Poll for status only if analysis is successful
  const {
    data: status,
    restartPolling,
    error: statusError,
    isError: isStatusError,
    isPollingLoading: isStatusPollingLoading,
  } = useGetPeerAnalysisStatus({
    peerId: data?.id,
    strategyId,
    peerType: "remote",
    enabled: isAnalyzeSuccess,
  });

  // Website states
  const nodeControlRef = useRef(null);
  const { setEdges, updateNodeData } = useReactFlow();
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [urlValidation, setUrlValidation] = useState<URLValidationResult>({
    isValid: false,
  });

  // Processing states
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isComplete: false,
    error: null,
    lastFailedOperation: null,
  });

  const [userNotes, setUserNotes] = useState<string>("");

  // If data?.url exists, show preview directly
  useEffect(() => {
    if (data?.url) {
      setUserNotes(data?.ai_notes ?? "");
      setWebsiteData({
        url: data.url,
        title: data?.ai_title || data.title || data.url,
        content: data.content || "",
        favicon: data.favicon || "🌐",
        screenshot: data.screenshot || "",
      });
      setWebsiteUrl(data.url);
    } else {
      setWebsiteData(null);
    }
  }, [data]);

  // Handle pasted URL data from props (if needed)
  useEffect(() => {
    if (data?.dataToAutoUpload?.data) {
      setWebsiteUrl(data?.dataToAutoUpload?.data);
    }
  }, [data]);

  // Comprehensive URL validation
  const validateUrl = (url: string): URLValidationResult => {
    if (!url || url.trim() === "") {
      return { isValid: false, error: "URL is required" };
    }

    const trimmedUrl = url.trim();

    // Check for basic URL format
    let urlToTest = trimmedUrl;
    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://")
    ) {
      urlToTest = `https://${trimmedUrl}`;
    }

    try {
      const urlObj = new URL(urlToTest);

      // Check protocol
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
        return {
          isValid: false,
          error: "Only HTTP and HTTPS protocols are supported",
        };
      }

      // Check for localhost and local IPs (optional security measure)
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.")
      ) {
        return {
          isValid: false,
          error: "Local and private network URLs are not allowed",
        };
      }

      // Check for valid domain structure
      if (!hostname.includes(".") && hostname !== "localhost") {
        return { isValid: false, error: "Please enter a valid domain name" };
      }

      // Check for common invalid patterns
      if (
        hostname.includes("..") ||
        hostname.startsWith(".") ||
        hostname.endsWith(".")
      ) {
        return { isValid: false, error: "Invalid domain format" };
      }

      // Check for minimum domain length
      if (hostname.length < 3) {
        return { isValid: false, error: "Domain name too short" };
      }

      // Check for valid TLD (basic check)
      const parts = hostname.split(".");
      const tld = parts[parts.length - 1];
      if (tld.length < 2 || tld.length > 6) {
        return { isValid: false, error: "Invalid top-level domain" };
      }

      // Check for suspicious patterns
      if (hostname.includes("--") || hostname.includes("__")) {
        return { isValid: false, warning: "Unusual domain format detected" };
      }

      // Additional security checks
      const suspiciousPatterns = [
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "goo.gl",
        "ow.ly",
        "short.link",
        "tiny.cc",
        "is.gd",
        "buff.ly",
      ];

      if (suspiciousPatterns.some((pattern) => hostname.includes(pattern))) {
        return {
          isValid: true,
          warning: "Shortened URL detected - please verify the destination",
        };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: "Invalid URL format" };
    }
  };

  // Update URL validation on input change
  useEffect(() => {
    const validation = validateUrl(websiteUrl);
    setUrlValidation(validation);
  }, [websiteUrl]);

  // Website fetching and AI processing using mutation
  const processWebsiteWithAI = (url: string) => {
    // Double-check validation before processing
    const validation = validateUrl(url);
    if (!validation.isValid) {
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: validation.error || "Invalid URL",
        lastFailedOperation: null,
      });
      return;
    }

    setProcessingState({
      isProcessing: true,
      isComplete: false,
      error: null,
      lastFailedOperation: null,
    });

    // Use analyzeRemotePeer mutation
    analyzeRemotePeer(
      {
        strategyId,
        peerId: data?.id, // using data.id as peerId
        data: {
          search_query: url,
          ai_notes: userNotes || undefined,
        },
      },
      {
        onSuccess: (result: any) => {
          // start polling
          restartPolling();
          // You may need to adjust result structure based on API
          setWebsiteData({
            url,
            title: url,
            content: "",
            favicon: "🌐",
            screenshot: "",
          });
          setProcessingState({
            isProcessing: false,
            isComplete: true,
            error: null,
            lastFailedOperation: null,
          });
        },
        onError: (error: any) => {
          setProcessingState({
            isProcessing: false,
            isComplete: false,
            error: error?.response?.data?.message || "Processing failed",
            lastFailedOperation: "analyze",
          });
        },
      }
    );
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWebsiteUrl(e.target.value);
  };

  const handleUrlSubmit = (urlToSubmit?: string) => {
    const url = urlToSubmit || websiteUrl;
    const validation = validateUrl(url);

    if (!validation.isValid) {
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: validation.error || "Invalid URL",
        lastFailedOperation: null,
      });
      return;
    }

    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    setWebsiteUrl(formattedUrl);
    processWebsiteWithAI(formattedUrl);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUrlSubmit();
    }
  };

  const handleRemoveWebsite = () => {
    resetAnalyzeRemotePeerMutation();
    setWebsiteUrl("");
    setWebsiteData(null);
    setProcessingState({
      isProcessing: false,
      isComplete: false,
      error: null,
      lastFailedOperation: null,
    });
    setUserNotes("");
    setUrlValidation({ isValid: false });
    updateNodeData(id, {
      is_ready_to_interact: false,
      ai_title: "",
      url: "",
    });

    if (data?.is_ready_to_interact) {
      data.is_ready_to_interact = false;
      data.ai_title = "";
      data.url = "";
    }

    if (status?.is_ready_to_interact) {
      status.is_ready_to_interact = false;
      status.ai_title = "";
    }

    successNote({
      title: "Link removed",
      description: "Link removed successfully",
    });

    resetPeer(
      { peerId: data?.id, strategyId, peerType: "remote" },
      {
        onError: (error: any) => {
          toast({
            title: "Failed to remove Link",
            description:
              error?.response?.data?.message ?? "Something went wrong...",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleReprocess = () => {
    if (websiteUrl && urlValidation.isValid) {
      processWebsiteWithAI(websiteUrl);
    }
  };

  const handleVisitWebsite = () => {
    if (websiteData?.url) {
      window.open(websiteData.url, "_blank", "noopener,noreferrer");
    }
  };

  // Optionally, handle mutation error globally
  useEffect(() => {
    if (isAnalyzeError && analyzeError) {
      setProcessingState((prev) => ({
        ...prev,
        isProcessing: false,
        error: analyzeError?.message || "Processing failed",
      }));
    }
  }, [isAnalyzeError, analyzeError]);

  // Optionally, handle mutation loading state
  useEffect(() => {
    if (isAnalyzing) {
      setProcessingState((prev) => ({ ...prev, isProcessing: true }));
    }
  }, [isAnalyzing]);

  // Update processing state if backend status is ready (status polling)
  useEffect(() => {
    if (status?.is_ready_to_interact) {
      setProcessingState({
        isProcessing: false,
        isComplete: true,
        error: null,
        lastFailedOperation: null,
      });
      setWebsiteData((prev: any) => ({
        ...prev,
        title: status?.ai_title ?? "",
      }));
    }
  }, [status]);

  const isProcessingAny = useMemo(
    () => isAnalyzing || processingState.isProcessing || isStatusPollingLoading,
    [isAnalyzing, processingState.isProcessing, isStatusPollingLoading]
  );

  const currentError = useMemo(() => {
    if (isStatusError && statusError) {
      return {
        message:
          (statusError as any)?.response?.data?.message ||
          "Website is not ready to interact",
        type: "analyze" as const,
      };
    }
    if (isAnalyzeError && analyzeError) {
      return {
        message:
          (analyzeError as any)?.response?.data?.message ||
          "Failed to analyze website",
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
    isStatusError,
    statusError,
    isAnalyzeError,
    analyzeError,
    processingState.error,
    processingState.lastFailedOperation,
  ]);

  // Retry functionality
  const handleRetry = useCallback(() => {
    if (!currentError) return;

    if (currentError.type === "analyze") {
      setProcessingState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
      }));
      // Retry analyze
      handleReprocess();
    }
  }, [
    currentError,
    setProcessingState,
    analyzeRemotePeer,
    strategyId,
    data?.id,
  ]);

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

  return (
    <NodeWrapper
      id={id}
      type="remoteNode"
      strategyId={strategyId}
      className={cn("bg-white", websiteData ? "h-[2px]" : "h-[1px]")}
    >
      <div className="react-flow__node" onKeyDown={preventNodeDeletionKeys}>
        <div ref={nodeControlRef} className={`nodrag`} />
        <TooltipProvider>
          <div className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden relative">
            {!websiteData ? (
              // URL Input Interface
              <div className="space-y-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm font-medium">Website</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!canConnect && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Shield className="w-4 h-4 text-yellow-300" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            Complete analysis to enable connections
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>

                {/* URL Input */}
                <div className="p-6 space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Enter any website url"
                      value={websiteUrl}
                      onChange={handleUrlChange}
                      onKeyDown={handleKeyPress}
                      className={cn(
                        "pr-12 text-base border-gray-200 focus:border-cyan-500 focus:ring-cyan-500",
                        urlValidation.isValid &&
                          "border-green-400 focus:border-green-500 focus:ring-green-500",
                        websiteUrl &&
                          !urlValidation.isValid &&
                          "border-red-400 focus:border-red-500 focus:ring-red-500",
                        urlValidation.warning &&
                          "border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500"
                      )}
                      disabled={isProcessingAny}
                    />
                    <Button
                      onClick={() => handleUrlSubmit()}
                      size="sm"
                      disabled={!urlValidation.isValid || isProcessingAny}
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full w-8 h-8 p-0 disabled:opacity-50"
                    >
                      {processingState.isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* URL Validation Feedback */}
                  {websiteUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {urlValidation.isValid ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">Valid URL</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-600">
                              {urlValidation.error || "Invalid URL"}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Warning for suspicious URLs */}
                      {urlValidation.warning && (
                        <div className="flex items-start gap-2 text-sm bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-yellow-700">
                            {urlValidation.warning}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Processing State */}
                  {isProcessingAny && (
                    <div className="bg-cyan-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                        <span className="text-sm font-medium text-cyan-700">
                          Fetching and analyzing website content...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {processingState.error && (
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
                        disabled={!urlValidation.isValid}
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {/* Security Notice */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700">
                        <div className="font-medium mb-1">Security Notice</div>
                        <div>
                          URLs are validated for security. Local networks,
                          suspicious domains, and invalid formats are blocked to
                          prevent costly processing.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Website Analysis Interface
              <div className="">
                {/* Header with Website Title */}
                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isProcessingAny ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">
                          AI is analyzing website...
                        </span>
                      </div>
                    ) : processingState.error ? (
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Analysis failed
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-300" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium truncate w-60 text-left">
                              {websiteData.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{websiteData.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {websiteData?.url && (
                      <IsReadyToInteract
                        canConnect={canConnect}
                        isLoading={isStatusPollingLoading}
                      />
                    )}

                    <Button
                      onClick={handleVisitWebsite}
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={handleRemoveWebsite}
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      disabled={isProcessingAny || isReseting}
                    >
                      {isReseting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Website Preview */}
                <div className="p-4">
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{websiteData.favicon}</span>
                      <div className="flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {websiteData.title}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{websiteData.title}</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="text-xs text-gray-500 truncate">
                          {websiteData.url}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Processing Overlay */}
                {isProcessingAny && (
                  <div className="px-4 py-2">
                    <div className="bg-cyan-50 p-3 rounded-lg flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                      <span className="text-sm font-medium text-cyan-700">
                        Analyzing website content...
                      </span>
                    </div>
                  </div>
                )}

                {!isProcessingAny && currentError && (
                  <div className="px-4 py-2">
                    <div className="bg-red-50 p-3 rounded-lg mb-3">
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
                        disabled={!urlValidation.isValid}
                      >
                        Retry Analysis
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes Input */}
                <div className="px-4 pb-4">
                  <AiNoteInput
                    color="cyan"
                    note={userNotes}
                    readOnly={!canConnect}
                    hideButton={!canConnect}
                    setNote={(val) => setUserNotes(val ?? "")}
                    isInputDisabled={isProcessingAny}
                    isLoading={isProcessingAny || isStatusPollingLoading}
                    strategyId={strategyId}
                    peerType="remote"
                    peerId={data?.id}
                  />
                </div>
              </div>
            )}
          </div>

          <NodeHandle
            type="source"
            canConnect={canConnect}
            position={sourcePosition}
          />
        </TooltipProvider>
      </div>
    </NodeWrapper>
  );
}
