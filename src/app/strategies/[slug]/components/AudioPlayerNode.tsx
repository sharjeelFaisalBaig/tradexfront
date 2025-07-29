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
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Download,
  Plus,
  Upload,
  X,
  Lightbulb,
  Loader2,
  Music,
  Mic,
  Square,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NodeWrapper from "./common/NodeWrapper";
import { useParams } from "next/navigation";
import {
  useAnalyzeAudioPeer,
  useResetPeer,
  useUploadAudioContent,
} from "@/hooks/strategy/useStrategyMutations";
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
  transcription: string;
  summary: string;
  confidence: number;
  tags: string[];
  duration: number;
  language: string;
  audioUrl?: string;
  ai_title?: string;
  ai_summary?: string;
}

interface ProcessingState {
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
  lastFailedOperation: "upload" | "analyze" | null;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}

interface AudioUploadNodeProps {
  id: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  data: any;
}

// Audio file validation constants
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/m4a",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
];

const MAX_AUDIO_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_RECORDING_DURATION = 600; // 10 minutes in seconds

export default function AudioUploadNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: AudioUploadNodeProps) {
  const strategyId = useParams()?.slug as string;
  const successNote = useSuccessNotifier();
  const { setEdges, updateNodeData } = useReactFlow();
  const [isRetryPolling, setIsRetryPolling] = useState(false);

  // Refs
  const nodeControlRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUploadedFileRef = useRef<File | null>(null); // Store original file for retry

  // Mutations
  const { mutate: resetPeer, isPending: isResetting } = useResetPeer();
  const {
    mutate: uploadAudio,
    isPending: isUploading,
    isError: isUploadError,
    error: uploadError,
    data: uploadData,
    isSuccess: uploadSuccess,
  } = useUploadAudioContent();
  const {
    mutate: analyzeAudioContent,
    isPending: isAnalyzing,
    isSuccess: isAnalyzeSuccess,
    isError: isAnalyzeError,
    error: analyzeError,
  } = useAnalyzeAudioPeer();

  // Status polling
  const {
    data: status,
    restartPolling,
    error: statusError,
    isError: isStatusError,
    isPollingLoading: isStatusPollingLoading,
  } = useGetPeerAnalysisStatus({
    strategyId,
    peerId: data?.id,
    peerType: "audio",
    enabled: (isRetryPolling || isAnalyzeSuccess) && !isResetting,
  });

  // State
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isComplete: false,
    error: null,
    lastFailedOperation: null,
  });

  // Audio upload states
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Recording states
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
  });
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [showRecordingInterface, setShowRecordingInterface] = useState(false);

  // AI Response states
  const [aiResponse, setAiResponse] = useState<AIProcessingResponse | null>(
    null
  );
  const [userNotes, setUserNotes] = useState<string>(data?.ai_notes ?? "");

  const speeds = [1, 1.5, 2];

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
    if (
      (data?.audio && !data?.is_ready_to_interact && !isProcessingAny) ||
      isStatusError ||
      statusError
    ) {
      return {
        message:
          (statusError as any)?.response?.data?.message ||
          "Audio is not ready to interact",
        type: "status" as const,
      };
    }
    if (isUploadError && uploadError) {
      return {
        message:
          (uploadError as any)?.response?.data?.message ||
          "Failed to upload audio",
        type: "upload" as const,
      };
    }
    if (isAnalyzeError && analyzeError) {
      return {
        message:
          (analyzeError as any)?.response?.data?.message ||
          "Failed to analyze audio",
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

    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return "Unsupported audio format. Supported formats: MP3, WAV, M4A, OGG, WebM, FLAC.";
    }

    if (file.size > MAX_AUDIO_FILE_SIZE) {
      return "File size too large. Maximum size is 50MB.";
    }

    return null;
  }, []);

  // Enhanced audio processing
  const processAudioFile = useCallback(
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

      // Store file for retry functionality
      lastUploadedFileRef.current = file;
      setCurrentFile(file);

      setProcessingState({
        isProcessing: true,
        isComplete: false,
        error: null,
        lastFailedOperation: null,
      });

      setFileName(file.name);
      setIsLoading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setUploadedAudio(e.target?.result as string);
      reader.onerror = () => {
        setProcessingState({
          isProcessing: false,
          isComplete: false,
          error: "Failed to read audio file",
          lastFailedOperation: "upload",
        });
      };
      reader.readAsDataURL(file);

      // Upload file
      const formData: any = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);

      uploadAudio(
        { strategyId, peerId: data?.id, data: formData },
        {
          onSuccess: (response) => {
            if (response?.audioUrl) {
              setUploadedAudio(response.audioUrl);
            }

            // Update node data
            updateNodeData(data?.id, { ai_notes: "" });

            // Proceed to analysis
            analyzeAudioContent(
              { strategyId, peerId: data?.id },
              {
                onSuccess: () => {
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
      strategyId,
      data?.id,
      uploadAudio,
      analyzeAudioContent,
      updateNodeData,
    ]
  );

  // Retry functionality
  const handleRetry = useCallback(() => {
    if (!currentError) return;

    if (currentError.type === "upload" && lastUploadedFileRef.current) {
      // Retry upload
      processAudioFile(lastUploadedFileRef.current);
    } else if (currentError.type === "status") {
      // Retry upload
      setIsRetryPolling(true);
      restartPolling();
    } else if (currentError.type === "analyze") {
      // Retry analysis
      setProcessingState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
      }));

      analyzeAudioContent(
        { strategyId, peerId: data?.id },
        {
          onSuccess: () => {
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
  }, [
    currentError,
    processAudioFile,
    analyzeAudioContent,
    strategyId,
    data?.id,
  ]);

  // Event handlers
  const handleFileSelect = useCallback(
    (file: File) => {
      if (file) {
        processAudioFile(file);
      }
    },
    [processAudioFile]
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

  const handleRemoveAudio = useCallback(() => {
    setUploadedAudio(null);
    setFileName("");
    setCurrentFile(null);
    setAiResponse(null);
    lastUploadedFileRef.current = null;
    setProcessingState({
      isProcessing: false,
      isComplete: false,
      error: null,
      lastFailedOperation: null,
    });
    setUserNotes("");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setShowRecordingInterface(false);

    updateNodeData(data?.id, {
      audio: "",
      title: "",
      ai_notes: "",
      ai_title: "",
      is_ready_to_interact: false,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    successNote({
      title: "Audio removed",
      description: "Audio removed successfully",
    });

    resetPeer(
      { peerId: data?.id, strategyId, peerType: "audio" },
      {
        onError: (error: any) => {
          toast({
            title: "Failed to remove audio",
            description:
              error?.response?.data?.message ?? "Something went wrong...",
            variant: "destructive",
          });
        },
      }
    );
  }, [data?.id, updateNodeData, successNote, resetPeer, strategyId]);

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

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;

      setRecordedChunks([]);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioLevel: 0,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: "Could not access microphone. Please check permissions.",
        lastFailedOperation: null,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      setRecordingState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
        setRecordingState((prev) => ({ ...prev, isPaused: false }));
      } else {
        mediaRecorderRef.current.pause();
        setRecordingState((prev) => ({ ...prev, isPaused: true }));
      }
    }
  };

  const saveRecording = () => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "audio/webm" });
      const filename = `recording-${Date.now()}.webm`;
      const recordedFile = new File([blob], filename, { type: "audio/webm" });

      // Process the recorded file
      handleFileSelect(recordedFile);
      setShowRecordingInterface(false);
    }
  };

  const discardRecording = () => {
    setRecordedChunks([]);
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioLevel: 0,
    });
    setShowRecordingInterface(false);
  };

  // Audio player controls
  const togglePlayPause = () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!duration && audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
          setProcessingState((prev) => ({
            ...prev,
            error: "Failed to play audio.",
          }));
        });
    }
  };

  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Effects
  useEffect(() => {
    // Handle auto-upload from data
    if (data?.dataToAutoUpload?.data) {
      handleFileSelect(data.dataToAutoUpload.data);
    }

    // Handle existing audio data
    if (data?.audio) {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (apiUrl.endsWith("/api")) apiUrl = apiUrl.replace(/\/api$/, "");
      const audioUrl = data.audio.startsWith("http")
        ? data.audio
        : apiUrl + data.audio;
      setUploadedAudio(audioUrl);
      const parts = data.audio.split("/");
      setFileName(parts[parts.length - 1] || data.title || "audio");
    }

    // Handle AI response data
    if (data?.ai_title || data?.ai_summary) {
      try {
        const parsedTitle = data?.ai_title ? JSON.parse(data.ai_title) : {};
        const parsedSummary = data.ai_summary
          ? JSON.parse(data.ai_summary)
          : {};

        setAiResponse({
          title: parsedTitle.title || data.title || "",
          peerId: data.id || "",
          transcription: parsedSummary.important_quotes?.join(" ") || "",
          summary: parsedSummary.summary || "",
          confidence: data.confidence || 0.95,
          tags: parsedSummary.key_topics || [],
          duration: data.duration || 0,
          language: data.language || "en",
        });
      } catch (e) {
        console.log({ e });
        console.error("Error parsing AI metadata:", e);
      }
    }

    // Handle user notes
    if (data?.ai_notes) {
      setUserNotes(data.ai_notes);
    }

    // Handle completion state
    if (data?.audio && data?.is_ready_to_interact) {
      setProcessingState((prev) => ({
        ...prev,
        lastFailedOperation: null,
        isComplete: true,
        error: null,
      }));
    }
  }, [data, handleFileSelect]);

  // Audio level monitoring for recording
  useEffect(() => {
    if (
      recordingState.isRecording &&
      !recordingState.isPaused &&
      analyserRef.current
    ) {
      const updateAudioLevel = () => {
        const analyser = analyserRef.current;
        if (!analyser) return;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        setRecordingState((prev) => ({ ...prev, audioLevel: normalizedLevel }));
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [recordingState.isRecording, recordingState.isPaused]);

  // Recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (recordingState.isRecording && !recordingState.isPaused) {
      interval = setInterval(() => {
        setRecordingState((prev) => {
          const newDuration = prev.duration + 0.1;

          // Auto-stop recording if max duration reached
          if (newDuration >= MAX_RECORDING_DURATION) {
            stopRecording();
            return prev;
          }
          return { ...prev, duration: newDuration };
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingState.isRecording, recordingState.isPaused]);

  // Audio player event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !uploadedAudio) return;

    const handleLoadedMetadata = () => {
      if (!audio) return;

      if (audio.duration === Infinity) {
        // Force duration calculation for blob/recorded audio
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          audio.currentTime = 0;
          setDuration(audio.duration);
        };
      } else if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      const newCurrentTime = audio.currentTime;
      setCurrentTime(newCurrentTime);
      if (audio.duration && !isNaN(audio.duration) && duration === 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setIsLoading(false);
      setProcessingState((prev) => ({
        ...prev,
        error: "Failed to load audio file.",
      }));
    };

    const handleLoadedData = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
        setIsLoading(false);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    if (uploadedAudio && audio.src !== uploadedAudio) {
      audio.load();
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [uploadedAudio, duration]);

  // Remove connections when node becomes not connectable
  useEffect(() => {
    if (!canConnect) {
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id)
      );
    }
  }, [canConnect, id, setEdges]);

  const progressValue = duration > 0 ? (currentTime / duration) * 100 : 0;
  const shouldShowUploadInterface = useMemo(
    () => !uploadedAudio && !showRecordingInterface,
    [uploadedAudio, showRecordingInterface]
  );

  console.log({ data, aiResponse, uploadedAudio });

  return (
    <NodeWrapper
      id={id}
      type="audioPlayerNode"
      strategyId={strategyId}
      className={cn(
        "bg-white",
        uploadedAudio || showRecordingInterface ? "h-[2px]" : "h-[1px]"
      )}
    >
      <div className="react-flow__node">
        <div ref={nodeControlRef} className="nodrag" />
        <TooltipProvider>
          <div className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden relative">
            {shouldShowUploadInterface ? (
              // Upload/Record Interface
              <div
                className={cn(
                  "relative bg-white rounded-2xl p-12 transition-all duration-200 border-2 border-dashed cursor-pointer",
                  isDragOver
                    ? "border-purple-400 bg-purple-50"
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
                  accept="audio/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="text-center">
                  {currentError && (
                    <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm font-medium flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      {currentError.message}
                    </div>
                  )}
                  <div className="mb-6 space-y-3">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectFile();
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-base font-medium w-full"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Select an audio file
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRecordingInterface(true);
                      }}
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-full text-base font-medium w-full"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Record audio
                    </Button>
                  </div>
                  <div className="text-gray-500 mb-4">
                    <span className="text-lg">or</span>
                  </div>
                  <div className="text-gray-600 text-lg">
                    Drag and drop an audio file here
                  </div>
                  <div className="text-sm text-gray-500 mt-4">
                    Supports: MP3, WAV, M4A, OGG, WebM, FLAC (Max 50MB)
                  </div>
                </div>
                {isDragOver && (
                  <div className="absolute inset-0 bg-purple-100 bg-opacity-70 rounded-2xl flex items-center justify-center z-10">
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                      <Upload className="w-12 h-12 text-purple-600 mb-2" />
                      <div className="text-purple-600 text-xl font-medium">
                        Drop your audio file here
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : showRecordingInterface ? (
              // Recording Interface
              <div className="space-y-0">
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        recordingState.isRecording && !recordingState.isPaused
                          ? "bg-white animate-pulse"
                          : "bg-white/50"
                      )}
                    />
                    <span className="text-sm font-medium">
                      {recordingState.isRecording
                        ? recordingState.isPaused
                          ? "Recording Paused"
                          : "Recording..."
                        : "Ready to Record"}
                    </span>
                  </div>
                  <Button
                    onClick={discardRecording}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-6 text-center space-y-6">
                  {/* Duration and Level Display */}
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-gray-800 tabular-nums">
                      {formatTime(recordingState.duration)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Max duration: {formatTime(MAX_RECORDING_DURATION)}
                    </div>
                    {/* Audio Level Bars */}
                    <div className="flex items-center justify-center gap-1 h-16">
                      {Array.from({ length: 20 }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 rounded-full transition-all duration-100",
                            recordingState.audioLevel > i / 20
                              ? "bg-red-500"
                              : "bg-gray-200"
                          )}
                          style={{
                            height: `${Math.max(
                              8,
                              recordingState.audioLevel * 60 +
                                Math.random() * 10
                            )}px`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Recording Controls */}
                  <div className="flex items-center justify-center gap-4">
                    {!recordingState.isRecording ? (
                      <Button
                        onClick={startRecording}
                        size="lg"
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 p-0"
                      >
                        <Mic className="w-8 h-8" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={pauseRecording}
                          size="lg"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50 rounded-full h-12 w-12 p-0 bg-transparent"
                        >
                          {recordingState.isPaused ? (
                            <Play className="w-6 h-6" />
                          ) : (
                            <Pause className="w-6 h-6" />
                          )}
                        </Button>
                        <Button
                          onClick={stopRecording}
                          size="lg"
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 p-0"
                        >
                          <Square className="w-8 h-8" />
                        </Button>
                      </>
                    )}
                  </div>
                  {/* Save/Discard Controls */}
                  {recordedChunks.length > 0 && !recordingState.isRecording && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={discardRecording}
                        variant="outline"
                        className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Discard
                      </Button>
                      <Button
                        onClick={saveRecording}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Save Recording
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Audio Player Interface
              <div className="space-y-0">
                {/* Hidden Audio Element */}
                <audio
                  ref={audioRef}
                  src={uploadedAudio || undefined}
                  preload="metadata"
                  crossOrigin="anonymous"
                  controls={false}
                />
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isProcessingAny ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">
                          AI is processing your audio...
                        </span>
                      </div>
                    ) : currentError ? (
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-red-300" />
                        <span className="text-sm font-medium">
                          Processing failed
                        </span>
                      </div>
                    ) : aiResponse?.title || status?.ai_title ? (
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-300" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium truncate w-72 text-left">
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
                        <Music className="w-4 h-4" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium truncate w-72 text-left">
                              {fileName}
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
                    {!isProcessingAny && uploadedAudio && (
                      <IsReadyToInteract
                        canConnect={canConnect}
                        isLoading={isStatusPollingLoading}
                      />
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAudio();
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      disabled={isProcessingAny || isResetting}
                    >
                      {isResetting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {/* Processing Overlay */}
                {isProcessingAny && (
                  <div className="bg-purple-50 p-4 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">
                        Ai is analyzing audio...
                      </span>
                    </div>
                  </div>
                )}
                {/* Player Controls */}
                <div className="p-4">
                  {fileName.includes("recording") ? (
                    // Recorded Audio UI
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Button
                              size="icon"
                              className="rounded-full bg-purple-500 hover:bg-purple-600 text-white h-12 w-12 disabled:opacity-50"
                              onClick={togglePlayPause}
                              disabled={isProcessingAny}
                            >
                              {isProcessingAny ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : isPlaying ? (
                                <Pause className="w-6 h-6 fill-white" />
                              ) : (
                                <Play className="w-6 h-6 fill-white" />
                              )}
                            </Button>
                            <div className="text-left">
                              <div className="text-sm font-medium text-purple-700">
                                Live Recording
                              </div>
                              <div className="text-xs text-purple-600">
                                {isPlaying ? "Playing..." : "Ready to play"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-700 tabular-nums">
                              {formatTime(currentTime)}
                            </div>
                            <div className="text-xs text-purple-600">
                              {isLoading ? "Loading..." : "Elapsed"}
                            </div>
                          </div>
                        </div>
                        {/* Waveform Animation */}
                        <div className="flex items-center justify-center gap-1 h-12 bg-white/50 rounded-lg p-2">
                          {Array.from({ length: 40 }, (_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1 rounded-full transition-all duration-150",
                                isPlaying
                                  ? "bg-purple-500 animate-pulse"
                                  : "bg-purple-300"
                              )}
                              style={{
                                height: `${Math.max(
                                  4,
                                  Math.random() * 32 +
                                    (isPlaying
                                      ? Math.sin(Date.now() / 100 + i) * 8
                                      : 0)
                                )}px`,
                                animationDelay: `${i * 50}ms`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs text-purple-600">
                          <span>🎙️ Recorded Audio</span>
                          <div className="flex items-center gap-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs px-2 py-1 h-6 min-w-[30px] border-purple-300 bg-transparent hover:bg-purple-50 text-purple-600"
                              onClick={cycleSpeed}
                              disabled={isProcessingAny}
                            >
                              {playbackSpeed}x
                            </Button>
                            <span>Duration: {formatTime(duration)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Uploaded Audio UI
                    <div className="flex items-center gap-3 mb-4">
                      <Button
                        size="icon"
                        className="rounded-full bg-purple-500 hover:bg-purple-600 text-white h-10 w-10 disabled:opacity-50"
                        onClick={togglePlayPause}
                        disabled={isProcessingAny}
                      >
                        {isProcessingAny ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-5 h-5 fill-white" />
                        ) : (
                          <Play className="w-5 h-5 fill-white" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <Slider
                          value={[progressValue]}
                          max={100}
                          step={0.1}
                          onValueChange={handleSeek}
                          className="w-full [&>span:first-child]:h-2 [&>span:first-child]:bg-purple-200 [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-purple-500"
                          disabled={isProcessingAny}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span className="tabular-nums">
                            {formatTime(currentTime)}
                          </span>
                          <span className="tabular-nums">
                            {formatTime(duration)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-6 min-w-[30px] border-gray-300 bg-transparent hover:bg-gray-50"
                        onClick={cycleSpeed}
                        disabled={isProcessingAny}
                      >
                        {playbackSpeed}x
                      </Button>
                    </div>
                  )}
                  {/* Error State with Retry */}
                  {currentError && (
                    <div className="mb-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-xs text-red-600 font-medium mb-1">
                          Processing Error
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
                  <AiNoteInput
                    color="purple"
                    note={userNotes}
                    readOnly={!canConnect}
                    hideButton={!canConnect}
                    setNote={(val) => setUserNotes(val ?? "")}
                    isLoading={isAnalyzing || isStatusPollingLoading}
                    isInputDisabled={isProcessingAny}
                    isButtonDisabled={isProcessingAny}
                    strategyId={strategyId}
                    peerId={data?.id}
                    peerType="audio"
                  />
                  {/* AI Analysis Summary */}
                  {aiResponse && aiResponse.summary && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h3 className="text-purple-700 font-semibold mb-2">
                        AI Summary:
                      </h3>
                      <p className="text-sm text-purple-800">
                        {aiResponse.summary}
                      </p>
                      {aiResponse.tags && aiResponse.tags.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-purple-600 font-medium text-xs mb-1">
                            Key Topics:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {aiResponse.tags.map((topic, index) => (
                              <span
                                key={index}
                                className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiResponse.transcription && (
                        <div className="mt-2">
                          <h4 className="text-purple-600 font-medium text-xs mb-1">
                            Transcription Excerpt:
                          </h4>
                          <p className="text-sm text-purple-800 italic">
                            "{aiResponse.transcription.substring(0, 200)}..."
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
