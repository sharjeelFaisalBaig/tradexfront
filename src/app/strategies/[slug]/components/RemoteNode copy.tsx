"use client";

import type React from "react";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
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
  HelpCircle,
  Download,
  Copy,
  ArrowRight,
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
  const strategyId = useParams()?.slug as string;

  const nodeControlRef = useRef(null);
  const { setEdges } = useReactFlow();

  // Website states
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [urlValidation, setUrlValidation] = useState<URLValidationResult>({
    isValid: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  // Handle pasted URL data from props (if needed)
  useEffect(() => {
    if (data?.pastedUrl) {
      setWebsiteUrl(data.pastedUrl);
      const validation = validateUrl(data.pastedUrl);
      if (validation.isValid) {
        handleUrlSubmit(data.pastedUrl);
      }
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

  // Website data responses
  const getWebsiteData = (url: string): WebsiteData => {
    return {
      url: url,
      title: "Stack Overflow - Developer Community",
      content:
        "Stack Overflow is the largest, most trusted online community for developers to learn, share their programming knowledge, and build their careers. Get answers to your coding questions.",
      favicon: "📚",
      screenshot: "/placeholder.svg?height=200&width=400",
    };
  };

  // AI responses for different website types
  const getAIResponse = (websiteData: WebsiteData): AIProcessingResponse => {
    return {
      title: "AI Research & Technology Platform",
      peerId: "peer_web_7x9k2m4n8p",
      summary:
        "This website focuses on artificial intelligence research and development, providing insights into cutting-edge AI technologies and their applications across various industries.",
      keyPoints: [
        "Advanced AI research and development",
        "Focus on artificial general intelligence",
        "Commitment to AI safety and ethics",
        "Open source contributions to AI community",
      ],
      sentiment: "Positive",
      confidence: 0.94,
      tags: ["AI", "research", "technology", "innovation"],
      wordCount: 847,
      language: "English",
      contentType: "Technology/Research",
    };
  };

  // Website fetching and AI processing
  const processWebsiteWithAI = async (url: string) => {
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

    try {
      // Simulate website fetching time (2-4 seconds)
      const fetchingTime = Math.random() * 2000 + 2000;
      await new Promise((resolve) => setTimeout(resolve, fetchingTime));

      // Simulate occasional fetch errors (15% chance)
      // throw new Error("Failed to fetch website content. Please check the URL and try again.")

      // Get website data
      const websiteData = getWebsiteData(url);
      setWebsiteData(websiteData);

      // Simulate AI processing time (2-3 seconds)
      const processingTime = Math.random() * 1000 + 2000;
      await new Promise((resolve) => setTimeout(resolve, processingTime));

      // Get AI response
      const result = getAIResponse(websiteData);

      // Update states with API response
      setAiResponse(result);
      setProcessingState({
        isProcessing: false,
        isComplete: true,
        error: null,
      });

      console.log("🌐 Website AI Response:", result);
    } catch (error) {
      console.error("Website AI Processing Error:", error);
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: error instanceof Error ? error.message : "Processing failed",
      });
    }
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
  };

  const handleNotesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserNotes(e.target.value);
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
    console.log("Copied summary to clipboard");
  };

  const handleVisitWebsite = () => {
    if (websiteData?.url) {
      window.open(websiteData.url, "_blank", "noopener,noreferrer");
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

  console.log({ id, data });

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
          <div className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden">
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
                      disabled={processingState.isProcessing}
                    />
                    <Button
                      onClick={() => handleUrlSubmit()}
                      size="sm"
                      disabled={
                        !urlValidation.isValid || processingState.isProcessing
                      }
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
                  <div className="relative">
                    <Input
                      placeholder="Add notes for AI to use..."
                      value={userNotes}
                      onChange={handleNotesChange}
                      className="pr-8 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
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
                        <span className="text-sm font-medium truncate">
                          {aiResponse.title}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm font-medium truncate">
                          {websiteData.title}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
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
                      disabled={processingState.isProcessing}
                    >
                      <X className="w-4 h-4" />
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
                <div className="px-4 pt-4">
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{websiteData.favicon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {websiteData.title}
                        </div>
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
                  <div className="relative">
                    <Input
                      placeholder="Add notes for AI to use..."
                      value={userNotes}
                      onChange={handleNotesChange}
                      className="pr-8 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
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
          <Handle
            position={sourcePosition}
            type="source"
            isConnectableEnd={canConnect}
            isConnectable={canConnect}
            isConnectableStart={canConnect}
            style={{ width: "30px", height: "30px" }}
          />
        </TooltipProvider>
      </div>
    </NodeWrapper>
  );
}
