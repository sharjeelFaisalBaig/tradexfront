"use client";

import type React from "react";

import { useState, useRef, useEffect, type ChangeEvent, useMemo } from "react";
import { Position, useReactFlow } from "@xyflow/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Download,
  Copy,
  X,
  Lightbulb,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  } = useAnalyzeRemotePeer();

  // Poll for status only if analysis is successful
  const { data: status, isPollingLoading: isStatusPollingLoading } =
    useGetPeerAnalysisStatus({
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
  });

  // AI Response states
  const [aiResponse, setAiResponse] = useState<AIProcessingResponse | null>(
    null
  );
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
      });
      return;
    }

    setProcessingState({
      isProcessing: true,
      isComplete: false,
      error: null,
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
          // You may need to adjust result structure based on API
          setAiResponse(result?.aiResponse || result);
          setWebsiteData({
            url,
            title: result?.aiResponse?.title || result?.title || url,
            content: result?.aiResponse?.summary || result?.summary || "",
            favicon: "🌐",
            screenshot: "",
          });
          setProcessingState({
            isProcessing: false,
            isComplete: true,
            error: null,
          });
        },
        onError: (error: any) => {
          setProcessingState({
            isProcessing: false,
            isComplete: false,
            error: error?.response?.data?.message || "Processing failed",
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
    setWebsiteUrl("");
    setWebsiteData(null);
    setAiResponse(null);
    setProcessingState({
      isProcessing: false,
      isComplete: false,
      error: null,
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

  const handleDownload = () => {
    if (websiteData && aiResponse) {
      const content = `Website Analysis Report
      
            URL: ${websiteData.url}
            Title: ${websiteData.title}

            AI Analysis:
            ${aiResponse.summary}

            Key Points:
            ${aiResponse.keyPoints.map((point) => `• ${point}`).join("\n")}

            Tags: ${aiResponse.tags.join(", ")}
            Sentiment: ${aiResponse.sentiment}
            Confidence: ${Math.round(aiResponse.confidence * 100)}%
            Word Count: ${aiResponse.wordCount}
            Language: ${aiResponse.language}
            Content Type: ${aiResponse.contentType}
`;

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `website-analysis-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleCopySummary = () => {
    const summary = aiResponse?.summary || "No analysis available";
    navigator.clipboard.writeText(summary);
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
      });
    }
  }, [status]);

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
      <div className="react-flow__node">
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
                    disabled={processingState.isProcessing}
                  />

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
                  {processingState.isProcessing && (
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

                  {/* Notes Input */}
                  <AiNoteInput
                    color="cyan"
                    note={userNotes}
                    readOnly={canConnect}
                    hideButton={canConnect}
                    onButtonClick={handleUrlSubmit}
                    setNote={(val) => setUserNotes(val ?? "")}
                    isLoading={
                      processingState.isProcessing || isStatusPollingLoading
                    }
                    isInputDisabled={processingState.isProcessing}
                    isButtonDisabled={
                      !urlValidation.isValid || processingState.isProcessing
                    }
                  />
                </div>
              </div>
            ) : (
              // Website Analysis Interface
              <div className="space-y-0">
                {/* Header with Website Title */}
                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {processingState.isProcessing ? (
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
                    ) : aiResponse ? (
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-300" />
                        <span className="text-sm font-medium truncate w-60 text-left">
                          {aiResponse.title ?? "Website"}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium truncate w-60 text-left">
                              {aiResponse.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{aiResponse.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium truncate w-60 text-left">
                              {status?.ai_title || websiteData.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {status?.ai_title || websiteData.title}
                            </p>
                          </TooltipContent>
                        </Tooltip>
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
                            Ready to connect to other nodes
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {!canConnect && !isStatusPollingLoading && (
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
                      disabled={processingState.isProcessing || isReseting}
                    >
                      {isReseting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-white/20 h-8 w-8"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={handleDownload}
                          className="cursor-pointer"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download analysis
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleCopySummary}
                          className="cursor-pointer"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy summary
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                {processingState.isProcessing && (
                  <div className="px-4 py-2">
                    <div className="bg-cyan-50 p-3 rounded-lg flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                      <span className="text-sm font-medium text-cyan-700">
                        Analyzing website content...
                      </span>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {processingState.error && (
                  <div className="px-4 py-2">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-red-600 font-medium mb-1">
                        Analysis Error
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
                        Retry Analysis
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes Input */}
                <div className="px-4 pb-4">
                  <AiNoteInput
                    hideButton
                    color="cyan"
                    note={userNotes}
                    readOnly={canConnect}
                    setNote={(val) => setUserNotes(val ?? "")}
                    isInputDisabled={processingState.isProcessing}
                    isLoading={
                      processingState.isProcessing || isStatusPollingLoading
                    }
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
