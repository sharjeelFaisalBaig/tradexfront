"use client";
import {
  useState,
  useRef,
  useEffect,
  type DragEvent,
  type ChangeEvent,
  useMemo,
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
  FileText,
  Loader2,
  Shield,
  CheckCircle,
  File,
  FileSpreadsheet,
  FileImage,
  Download,
  Eye,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NodeWrapper from "./common/NodeWrapper";
import { useParams } from "next/navigation";
import {
  useAnalyzeDocumentPeer,
  useResetPeer,
  useUploadDocumentContent,
} from "@/hooks/strategy/useStrategyMutations";
import { useGetPeerAnalysisStatus } from "@/hooks/strategy/useGetPeerAnalysisStatus";
import { toast } from "@/hooks/use-toast";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

// Types for AI integration
interface AIProcessingResponse {
  title: string;
  peerId: string;
  summary: string;
  content: string;
  keyPoints: string[];
  documentType: string;
  language: string;
  wordCount: number;
  pageCount: number;
  confidence: number;
  tags: string[];
  entities: string[];
  sentiment?: string;
}

interface ProcessingState {
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
}

interface DocumentInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// Supported document types
const SUPPORTED_DOCUMENT_TYPES = {
  "application/pdf": {
    icon: FileText,
    label: "PDF Document",
    color: "text-red-500",
  },
  "application/msword": {
    icon: FileText,
    label: "Word Document",
    color: "text-blue-500",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: FileText,
    label: "Word Document",
    color: "text-blue-500",
  },
  "application/vnd.ms-excel": {
    icon: FileSpreadsheet,
    label: "Excel Spreadsheet",
    color: "text-green-500",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    icon: FileSpreadsheet,
    label: "Excel Spreadsheet",
    color: "text-green-500",
  },
  "application/vnd.ms-powerpoint": {
    icon: FileImage,
    label: "PowerPoint Presentation",
    color: "text-orange-500",
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    icon: FileImage,
    label: "PowerPoint Presentation",
    color: "text-orange-500",
  },
  "text/plain": {
    icon: FileText,
    label: "Text Document",
    color: "text-gray-500",
  },
  "application/rtf": {
    icon: FileText,
    label: "Rich Text Document",
    color: "text-purple-500",
  },
  "text/csv": {
    icon: FileSpreadsheet,
    label: "CSV File",
    color: "text-green-600",
  },
};

export default function DocumentUploadNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: any) {
  console.log("DocumentUploadNode data:", data);

  const strategyId = useParams()?.slug as string;
  const successNote = useSuccessNotifier();

  // mutations
  const { mutate: resetPeer, isPending: isReseting } = useResetPeer();
  const { mutate: uploadDocContent } = useUploadDocumentContent();
  const {
    mutate: analyzeVideoContent,
    isPending: isAnalyzing,
    isSuccess: isAnalyzeSuccess,
  } = useAnalyzeDocumentPeer();

  // Upload state
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean;
    isSuccess: boolean;
    error: string | null;
  }>({
    isUploading: false,
    isSuccess: false,
    error: null,
  });

  const nodeControlRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setEdges } = useReactFlow();

  // Document states
  const [uploadedDocument, setUploadedDocument] = useState<string | null>(null); // Stores base64 or URL
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);
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

  // Only poll for status if analysis is successful
  const { isPollingLoading: isStatusPollingLoading } = useGetPeerAnalysisStatus(
    {
      peerId: data?.id,
      strategyId,
      peerType: "docs",
      enabled: isAnalyzeSuccess,
    }
  );

  // Handle initial document data from props (like VideoUploadNode)
  useEffect(() => {
    // If document_peer_media exists, treat as already uploaded
    if (data?.document_peer_media) {
      // Set uploadedDocument to the media URL
      setUploadedDocument(data.document_peer_media);
      // Guess type from file extension
      const ext = data.document_peer_media.split(".").pop()?.toLowerCase();
      let type = "application/octet-stream";
      if (ext === "pdf") type = "application/pdf";
      else if (["doc", "docx"].includes(ext))
        type =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (["xls", "xlsx"].includes(ext))
        type =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      else if (["ppt", "pptx"].includes(ext))
        type =
          "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      else if (ext === "txt") type = "text/plain";
      else if (ext === "rtf") type = "application/rtf";
      else if (ext === "csv") type = "text/csv";

      setDocumentInfo({
        name: data.title || "Document",
        size: 0, // Size unknown when loaded from URL
        type,
        lastModified: Date.now(),
      });
      // Optionally set AI response if available
      if (data.ai_title || data.ai_summary) {
        setAiResponse({
          title: data.ai_title || data.title || "Document",
          peerId: data.id,
          summary: data.ai_summary || "",
          content: "",
          keyPoints: [],
          documentType: getDocumentLabel(type),
          language: "",
          wordCount: 0,
          pageCount: 0,
          confidence: 0,
          tags: [],
          entities: [],
          sentiment: undefined,
        });
        setProcessingState({
          isProcessing: false,
          isComplete: true,
          error: null,
        });
      }
    } else if (data?.pastedDocument && data?.pastedDocumentInfo) {
      setUploadedDocument(data.pastedDocument);
      setDocumentInfo(data.pastedDocumentInfo);
      // Auto-process pasted documents
      processDocumentWithAI(data.pastedDocument, data.pastedDocumentInfo);
    }
  }, [data]);

  // Mock AI processing function (not used in actual upload flow, but kept for context)
  const processDocument = (docInfo: DocumentInfo): AIProcessingResponse => {
    const documentType =
      SUPPORTED_DOCUMENT_TYPES[
        docInfo.type as keyof typeof SUPPORTED_DOCUMENT_TYPES
      ]?.label || "Unknown Document";
    return {
      title: docInfo.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      peerId: `peer_${Math.random().toString(36).substr(2, 12)}`,
      summary:
        "This document contains comprehensive information about business strategies and market analysis. The content covers key performance indicators, growth projections, and competitive landscape analysis.",
      content:
        "Document content extracted successfully. The document discusses various aspects of business development, strategic planning, and implementation frameworks.",
      keyPoints: [
        "Strategic planning and implementation",
        "Market analysis and competitive positioning",
        "Performance metrics and KPIs",
        "Growth opportunities and challenges",
        "Risk assessment and mitigation strategies",
      ],
      documentType,
      language: "English",
      wordCount: Math.floor(Math.random() * 5000) + 1000,
      pageCount: Math.floor(Math.random() * 20) + 1,
      confidence: 0.92,
      tags: ["business", "strategy", "analysis", "planning", "growth"],
      entities: [
        "Company Name",
        "Market Segment",
        "Financial Data",
        "Strategic Goals",
      ],
      sentiment: "neutral",
    };
  };

  // API Integration Function
  const processDocumentWithAI = async (
    documentData: string, // This will be a base64 string
    docInfo: DocumentInfo
  ) => {
    setUploadState({ isUploading: true, isSuccess: false, error: null });
    try {
      const formData: any = new FormData();
      // Convert base64 to Blob for upload
      if (documentData && docInfo) {
        const arr = documentData.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
        const bstr = atob(arr[1]);
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          u8arr[i] = bstr.charCodeAt(i);
        }
        const file = new window.File([u8arr], docInfo.name, { type: mime });
        formData.append("file", file);
        formData.append("title", docInfo.name.replace(/\.[^/.]+$/, ""));
      }

      // Directly upload document to backend
      if (strategyId && docInfo && formData.has("file")) {
        uploadDocContent(
          {
            strategyId,
            peerId: data?.id,
            data: formData,
          },
          {
            onSuccess: () => {
              setUploadState({
                isUploading: false,
                isSuccess: true,
                error: null,
              });
              // If the backend returns the URL, update uploadedDocument here.
              // For now, we assume data.document_peer_media will be updated
              // by the parent component or a global state after successful upload.
            },
            onError: (error: any) => {
              setUploadState({
                isUploading: false,
                isSuccess: false,
                error: error?.message || "Upload failed. Please try again.",
              });
              toast({
                title: error?.message || "Error",
                description:
                  error?.response?.data?.message ||
                  "Upload failed. Please try again.",
                variant: "destructive",
              });
            },
          }
        );
      }
    } catch (error: any) {
      setUploadState({
        isUploading: false,
        isSuccess: false,
        error:
          error instanceof Error ? error.message : "Document upload failed",
      });
      toast({
        title: error?.message || "Error",
        description: error?.response?.data?.message || "Document upload failed",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getDocumentIcon = (type: string) => {
    const docType =
      SUPPORTED_DOCUMENT_TYPES[type as keyof typeof SUPPORTED_DOCUMENT_TYPES];
    return docType ? docType.icon : File;
  };

  const getDocumentColor = (type: string) => {
    const docType =
      SUPPORTED_DOCUMENT_TYPES[type as keyof typeof SUPPORTED_DOCUMENT_TYPES];
    return docType ? docType.color : "text-gray-500";
  };

  const getDocumentLabel = (type: string) => {
    const docType =
      SUPPORTED_DOCUMENT_TYPES[type as keyof typeof SUPPORTED_DOCUMENT_TYPES];
    return docType ? docType.label : "Document";
  };

  const isDocumentSupported = (type: string): boolean => {
    return Object.keys(SUPPORTED_DOCUMENT_TYPES).includes(type);
  };

  const handleFileSelect = (file: File) => {
    if (file && isDocumentSupported(file.type)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const documentData = e.target?.result as string; // This will be a data URL (e.g., data:application/pdf;base64,...)
        const docInfo: DocumentInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };
        setUploadedDocument(documentData);
        setDocumentInfo(docInfo);
        // Auto-process uploaded documents
        processDocumentWithAI(documentData, docInfo);
      };
      reader.readAsDataURL(file);
    } else {
      // Show error for unsupported file types
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error:
          "Unsupported file type. Please upload a PDF, Word, Excel, PowerPoint, or text document.",
      });
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

  const handleRemoveDocument = () => {
    resetPeer(
      { peerId: data?.id, strategyId, peerType: "docs" },
      {
        onSuccess: (data) => {
          setUploadedDocument(null);
          setDocumentInfo(null);
          setAiResponse(null);
          setProcessingState({
            isProcessing: false,
            isComplete: false,
            error: null,
          });
          setUploadState({ isUploading: false, isSuccess: false, error: null });
          setUserNotes("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }

          successNote({
            title: "Document removed",
            description: data?.message ?? "Document removed successfully",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Failed to remove Document",
            description:
              error?.response?.data?.message ?? "Something went wrong...",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleNotesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserNotes(e.target.value);
  };

  const handleReprocess = () => {
    if (uploadedDocument && documentInfo) {
      if (uploadedDocument.startsWith("data:")) {
        // If it's a base64 string, it means the initial upload failed or needs retry
        processDocumentWithAI(uploadedDocument, documentInfo);
      } else {
        // If it's a URL, it means the document is already uploaded, but analysis might have failed.
        // Trigger re-analysis if possible, or just reset state to allow user to trigger via notes.
        setProcessingState({
          isProcessing: true,
          isComplete: false,
          error: null,
        });
        analyzeVideoContent(
          {
            data: { ai_notes: userNotes }, // Use existing notes or empty
            strategyId: strategyId,
            peerId: data?.id,
          },
          {
            onSuccess: () => {
              setProcessingState({
                isProcessing: false,
                isComplete: true,
                error: null,
              });
              successNote({
                title: "Analysis Retried",
                description: "Document analysis re-triggered successfully.",
              });
            },
            onError: (error: any) => {
              setProcessingState({
                isProcessing: false,
                isComplete: false,
                error: error?.message || "Failed to re-analyze document.",
              });
              toast({
                title: error?.message || "Error",
                description:
                  error?.response?.data?.message ||
                  "Failed to re-analyze document.",
                variant: "destructive",
              });
            },
          }
        );
      }
    }
    // Reset upload state regardless, as reprocess is for processing/upload errors
    setUploadState({ isUploading: false, isSuccess: false, error: null });
  };

  const handlePreview = () => {
    if (uploadedDocument && documentInfo) {
      if (uploadedDocument.startsWith("data:")) {
        // For base64 data URLs, create a Blob and then an object URL for reliable preview
        const parts = uploadedDocument.split(",");
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch
          ? mimeMatch[1]
          : documentInfo.type || "application/octet-stream";
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        // Note: object URLs created with createObjectURL should be revoked when no longer needed
        // However, for a new window/tab, the browser manages its lifecycle.
      } else if (uploadedDocument.startsWith("/storage")) {
        let baseUrl = process.env.NEXT_PUBLIC_API_URL!;
        // Ensure /api is removed if present
        if (baseUrl.endsWith("/api")) {
          baseUrl = baseUrl.replace(/\/api$/, "");
        }

        // Now safely append the path
        const docUrl = `${baseUrl}${uploadedDocument}`;
        window.open(docUrl, "_blank");
      } else {
        window.open(uploadedDocument, "_blank");
      }
    }
  };

  const handleDownload = async () => {
    if (!uploadedDocument || !documentInfo) return;

    let fileUrl = uploadedDocument;

    // For /storage URLs, prepend base API URL
    if (uploadedDocument.startsWith("/storage")) {
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (baseUrl.endsWith("/api")) {
        baseUrl = baseUrl.replace(/\/api$/, "");
      }
      fileUrl = `${baseUrl}${uploadedDocument}`;
    }

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = documentInfo.name || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Determine if connection should be allowed
  const canConnect = useMemo(() => data?.is_ready_to_interact, [data]);

  // Remove connections when node becomes not connectable
  useEffect(() => {
    if (!canConnect) {
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id)
      );
    }
  }, [canConnect, id, setEdges]);

  const DocumentIcon = documentInfo
    ? getDocumentIcon(documentInfo.type)
    : FileText;

  return (
    <>
      <NodeWrapper
        id={id}
        type="documentUploadNode"
        strategyId={strategyId}
        // FIX: Removed problematic height classes. Let content define height.
        className={cn("bg-white")}
      >
        <div className="react-flow__node">
          <div ref={nodeControlRef} className={`nodrag`} />
          <TooltipProvider>
            <div
              className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden relative"
              onWheel={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {!uploadedDocument ? (
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
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv"
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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full text-base font-medium"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Select a document
                      </Button>
                    </div>
                    <div className="text-gray-500 mb-4">
                      <span className="text-lg">or</span>
                    </div>
                    <div className="text-gray-600 text-lg">
                      Drag and drop a document here
                    </div>
                    <div className="text-sm text-gray-500 mt-4">
                      Supports: PDF, Word, Excel, PowerPoint, Text, RTF, CSV
                    </div>
                  </div>
                  {isDragOver && (
                    <div className="absolute inset-0 bg-blue-100 bg-opacity-70 rounded-2xl flex items-center justify-center z-10">
                      <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                        <Upload className="w-12 h-12 text-blue-600 mb-2" />
                        <div className="text-blue-600 text-xl font-medium">
                          Drop your document here
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Processing/Preview Interface
                <div className="space-y-4">
                  {/* Header with AI Title or Processing State */}
                  <div className="bg-indigo-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {processingState.isProcessing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          <span className="text-sm font-medium text-gray-700">
                            AI is analyzing your document...
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
                          <FileText className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {aiResponse.title}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 truncate">
                            📄 {documentInfo?.name}
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
                        !isStatusPollingLoading &&
                        !processingState.isProcessing &&
                        uploadedDocument && (
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
                  {/* Document Preview */}
                  <div className="px-4">
                    <div className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DocumentIcon
                            className={cn(
                              "w-8 h-8",
                              documentInfo
                                ? getDocumentColor(documentInfo.type)
                                : "text-gray-500"
                            )}
                          />
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-[200px]">
                              {documentInfo?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {documentInfo
                                ? getDocumentLabel(documentInfo.type)
                                : "Document"}{" "}
                              •{" "}
                              {documentInfo
                                ? formatFileSize(documentInfo.size)
                                : ""}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreview();
                                }}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                disabled={processingState.isProcessing}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">Preview document</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload();
                                }}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                disabled={processingState.isProcessing}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">Download document</p>
                            </TooltipContent>
                          </Tooltip>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDocument();
                            }}
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            disabled={
                              processingState.isProcessing || isReseting
                            }
                          >
                            {isReseting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {/* Processing Overlay */}
                      {processingState.isProcessing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
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
                  {/* Upload State */}
                  {uploadState.isUploading && (
                    <div className="px-4">
                      <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Uploading document...
                        </span>
                      </div>
                    </div>
                  )}
                  {uploadState.error && (
                    <div className="px-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-xs text-red-600 font-medium mb-1">
                          Upload Error
                        </div>
                        <div className="text-sm text-red-700 mb-2">
                          {uploadState.error}
                        </div>
                        <Button
                          onClick={handleReprocess}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                        >
                          Retry Upload
                        </Button>
                      </div>
                    </div>
                  )}
                  {uploadState.isSuccess && (
                    <div className="px-4">
                      <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          Document uploaded successfully!
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Notes Input */}
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <div className="relative flex-1 flex items-center gap-2">
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
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600"
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
                    <Button
                      size="sm"
                      type="button"
                      disabled={
                        processingState.isProcessing ||
                        isAnalyzing ||
                        !userNotes
                      }
                      onClick={() => {
                        analyzeVideoContent(
                          {
                            data: { ai_notes: userNotes },
                            strategyId: strategyId,
                            peerId: data?.id,
                          },
                          {
                            onError: (error: any) => {
                              toast({
                                title: error?.message || "Error",
                                description:
                                  error?.response?.data?.message ||
                                  "Failed to analyze Document.",
                                variant: "destructive",
                              });
                            },
                          }
                        );
                      }}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full w-8 h-8 p-0 disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
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
