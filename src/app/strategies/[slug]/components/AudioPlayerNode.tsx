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
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Download,
  Copy,
  Plus,
  Upload,
  X,
  Lightbulb,
  Loader2,
  Music,
  Mic,
  Square,
  RotateCcw,
  Shield,
  CheckCircle,
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

// Types for AI integration
interface AIProcessingResponse {
  title: string;
  peerId: string;
  transcription: string;
  summary: string;
  confidence: number;
  tags: string[];
  duration: number;
  language: string;
  audioUrl?: string; // Add audioUrl to AIProcessingResponse if it comes from the backend
  ai_title?: string; // Add raw ai_title if needed for parsing
  ai_summary?: string; // Add raw ai_summary if needed for parsing
}

interface ProcessingState {
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}

export default function AudioPlayerNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: any) {
  // console.log("AudioPlayerNode", { data });
  const strategyId = useParams()?.slug as string;
  const successNote = useSuccessNotifier();

  // Processing states (tied to mutation)
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isComplete: false,
    error: null,
  });

  // mutations
  const { mutate: resetPeer, isPending: isReseting } = useResetPeer();
  const {
    mutate: uploadAudio,
    isPending: isUploading,
    isError: uploadError,
    error: uploadErrorMessage,
    data: uploadData,
    isSuccess: uploadSuccess,
  } = useUploadAudioContent();
  const {
    mutate: analyzeAudioContent,
    isPending: isAnalyzing,
    isSuccess: isAnalyzeSuccess,
  } = useAnalyzeAudioPeer();
  const { data: status, isPollingLoading: isStatusPollingLoading } =
    useGetPeerAnalysisStatus({
      strategyId,
      peerId: data?.id,
      peerType: "audio",
      // Enable polling only if audio is uploaded, not resetting, not yet ready, and not actively processing
      enabled:
        isAnalyzeSuccess &&
        !isReseting &&
        !data?.is_ready_to_interact &&
        !processingState.isProcessing,
    });

  const nodeControlRef = useRef(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { setEdges, updateNodeData } = useReactFlow();

  // Audio upload states
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<File | null>(null); // Store the actual File object
  const [isDragOver, setIsDragOver] = useState(false);

  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // For audio player loading

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
  const [isInitialLoadFromProps, setIsInitialLoadFromProps] = useState(true); // Flag to ensure initial data handling runs only once

  const speeds = [1, 1.5, 2];

  // Effect to handle initial loading of pre-existing audio and AI data from props
  useEffect(() => {
    if (isInitialLoadFromProps && data?.audio) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const cleanBaseUrl = baseUrl.endsWith("/api")
        ? baseUrl.replace(/\/api$/, "")
        : baseUrl;
      const cleanAudioPath = data.audio.startsWith("/")
        ? data.audio
        : `/${data.audio}`;
      const fullAudioUrl = `${cleanBaseUrl}${cleanAudioPath}`;

      setUploadedAudio(fullAudioUrl);
      setFileName(data.title || data.audio.split("/").pop() || "audio-file");
      setUserNotes(data.ai_notes || "");

      if (data.is_ready_to_interact && data.ai_title && data.ai_summary) {
        try {
          const parsedTitleObj = JSON.parse(data.ai_title);
          const parsedSummaryObj = JSON.parse(data.ai_summary);
          setAiResponse({
            title: parsedTitleObj.title || data.title,
            peerId: data.id,
            transcription:
              parsedSummaryObj.important_quotes?.join(" ") ||
              data.transcription ||
              "",
            summary: parsedSummaryObj.summary || "",
            confidence: data.confidence,
            tags: parsedSummaryObj.key_topics || [],
            duration: data.duration,
            language: data.language,
          });
          setProcessingState({
            isProcessing: false,
            isComplete: true,
            error: null,
          });
        } catch (e) {
          console.error("Error parsing AI metadata from data props:", e);
          setProcessingState({
            isProcessing: false,
            isComplete: false,
            error: "Failed to parse AI data from props.",
          });
        }
      } else {
        // Audio is present but not ready for interaction/analysis complete
        setProcessingState({
          isProcessing: false,
          isComplete: false,
          error: data.error_message || null,
        });
      }
      setIsLoading(true); // Assume audio needs to load in the player
      setIsInitialLoadFromProps(false); // Mark as processed
    } else if (data?.dataToAutoUpload?.data) {
      // Handle pasted audio data from props (ensure it doesn't conflict with initial data from 'audio' prop)
      handleFileSelect(data?.dataToAutoUpload?.data);
    }
  }, [data, isInitialLoadFromProps]); // Depend on data and the initial load flag

  // Update processing state based on mutation status
  useEffect(() => {
    setProcessingState((prev) => ({
      ...prev,
      isProcessing: isUploading,
      error: uploadError
        ? uploadErrorMessage?.message || "Upload failed"
        : null,
      isComplete: uploadSuccess,
    }));

    if (uploadSuccess && uploadData) {
      let processedTitle = uploadData.title;
      let processedSummary = uploadData.summary;
      let processedTags = uploadData.tags;
      let processedTranscription = uploadData.transcription;

      try {
        if (uploadData.ai_title) {
          processedTitle =
            JSON.parse(uploadData.ai_title)?.title || uploadData.title;
        }
        if (uploadData.ai_summary) {
          const summaryObj = JSON.parse(uploadData.ai_summary);
          processedSummary = summaryObj.summary || uploadData.summary;
          processedTags = summaryObj.key_topics || uploadData.tags;
          processedTranscription =
            summaryObj.important_quotes?.join(" ") || uploadData.transcription;
        }
      } catch (e) {
        console.error("Error parsing AI metadata from uploadData:", e);
      }

      setAiResponse({
        ...uploadData, // Spread existing data
        title: processedTitle,
        summary: processedSummary,
        tags: processedTags,
        transcription: processedTranscription,
      });

      // Set uploadedAudio if the mutation returns a new URL
      if (uploadData.audioUrl) {
        setUploadedAudio(uploadData.audioUrl);
      }

      // Set fileName for the UI if it changed or wasn't set.
      if (!fileName && uploadData.title) {
        setFileName(uploadData.title);
      }
      setIsLoading(true); // Audio player loading for the new file
    }
  }, [
    isUploading,
    uploadError,
    uploadErrorMessage,
    uploadSuccess,
    uploadData,
    fileName,
  ]);

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

        // Calculate average audio level
        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

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
        setRecordingState((prev) => ({
          ...prev,
          duration: prev.duration + 0.1,
        }));
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
      setDuration(audio.duration);
      setIsLoading(false);
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
      // Only load if src changed
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

      mediaRecorder.start(100); // Collect data every 100ms

      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioLevel: 0,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
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
      setCurrentFile(recordedFile); // Store the actual file

      // Reset all audio states first
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true); // For audio player loading
      setUploadedAudio(URL.createObjectURL(blob)); // Use object URL for playback
      setFileName(filename);
      setShowRecordingInterface(false);

      // Trigger the actual upload mutation
      const formData: any = new FormData();
      formData.append("file", recordedFile);
      formData.append("title", filename);
      uploadAudio({
        strategyId,
        peerId: data?.id,
        data: formData,
      });
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

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("audio/")) {
      setCurrentFile(file); // Store the actual file
      const reader = new FileReader();
      reader.onload = (e) => {
        const audioData = e.target?.result as string;
        setUploadedAudio(audioData); // For playback (e.g., base64 data URL)
        setFileName(file.name);
        setIsLoading(true); // For audio player loading

        // Trigger the actual upload mutation
        const formData: any = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        uploadAudio({
          strategyId,
          peerId: data?.id,
          data: formData,
        });
      };
      reader.readAsDataURL(file);
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

  const handleRemoveAudio = () => {
    // Optimistically reset all local states immediately for instant UI update
    setUploadedAudio(null);
    setFileName("");
    setCurrentFile(null); // Clear the stored file
    setAiResponse(null);
    setProcessingState({
      isProcessing: false,
      isComplete: false,
      error: null,
    });
    setUserNotes("");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setShowRecordingInterface(false);
    setIsInitialLoadFromProps(true); // Reset flag so initial data can be re-evaluated if props change
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Optimistically update the node data in React Flow to immediately affect `canConnect`
    updateNodeData(id, {
      audio: "",
      title: "",
      ai_notes: "",
      ai_title: "",
      ai_summary: "",
      is_ready_to_interact: false, // Set to false immediately
    });

    resetPeer(
      { peerId: data?.id, strategyId, peerType: "audio" },
      {
        onSuccess: (data) => {
          // Only show success notification, as states are already reset optimistically
          successNote({
            title: "Audio removed",
            description: data?.message ?? "Audio removed successfully",
          });
        },
        onError: (error: any) => {
          // If reset fails, show error. Consider reverting states if necessary for robust error handling.
          toast({
            title: "Failed to remove audio",
            description:
              error?.response?.data?.message ?? "Something went wrong...",
            variant: "destructive",
          });
          // For a more robust solution, you might want to revert the optimistic updates here
          // if the backend operation truly failed and the previous state should be restored.
        },
      }
    );
  };

  const handleReprocess = () => {
    if (currentFile) {
      const formData: any = new FormData();
      formData.append("file", currentFile);
      formData.append("title", currentFile.name);
      uploadAudio({
        strategyId,
        peerId: data?.id,
        data: formData,
      });
    } else if (uploadedAudio && fileName) {
      // If currentFile is null but uploadedAudio exists (e.g., loaded from props without saving original file object)
      // You might need a way to re-fetch/re-process the existing uploaded audio from its URL
      // For simplicity, we'll assume currentFile is available for reprocess if it was a local upload/recording.
      // If it came from props, re-running initial useEffect would be needed (handled by resetting isInitialLoadFromProps).
      console.warn(
        "Cannot reprocess audio without original File object or explicit backend reprocess API."
      );
    }
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
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleDownload = () => {
    if (uploadedAudio) {
      const link = document.createElement("a");
      link.href = uploadedAudio;
      link.download = fileName || "audio-file.mp3";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyTranscription = () => {
    const transcription =
      aiResponse?.transcription || "No transcription available";
    navigator.clipboard.writeText(transcription);
    console.log("Copied transcription to clipboard");
  };

  const progressValue = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Modified canConnect to immediately reflect isReseting state
  const canConnect = useMemo(() => data?.is_ready_to_interact, [data]);

  console.log({ data, canConnect, isReseting, status });

  // Remove connections when node becomes not connectable
  useEffect(() => {
    if (!canConnect) {
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id)
      );
    }
  }, [canConnect, id, setEdges]);

  // Determine which interface to show
  const shouldShowUploadInterface = !uploadedAudio && !showRecordingInterface;

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
        <div ref={nodeControlRef} className={`nodrag`} />
        <TooltipProvider>
          <div className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden relative">
            {shouldShowUploadInterface ? (
              // Upload/Record Interface
              <div
                className={cn(
                  "relative bg-white rounded-2xl p-12 transition-all duration-200 border-2 border-dashed",
                  isDragOver
                    ? "border-purple-400 bg-purple-50"
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
                  accept="audio/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="text-center">
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
                    Supports: MP3, WAV, M4A, OGG
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
                  {/* Audio Level Visualization */}
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-gray-800 tabular-nums">
                      {formatTime(recordingState.duration)}
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
              // Audio Player Interface (always shown if uploadedAudio is present)
              <div className="space-y-0">
                {/* Hidden Audio Element */}
                <audio
                  ref={audioRef}
                  src={uploadedAudio || undefined}
                  preload="metadata"
                  crossOrigin="anonymous"
                  controls={false}
                />

                {/* Header with AI Title or Processing State */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {processingState.isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">
                          AI is processing your audio...
                        </span>
                      </div>
                    ) : processingState.error ? (
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Processing failed
                        </span>
                      </div>
                    ) : aiResponse?.title ? ( // Use aiResponse.title
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-300" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium truncate w-72 text-left">
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
                        <Music className="w-4 h-4" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium truncate w-72 text-left">
                              {status?.ai_title || data?.ai_title || fileName}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {status?.ai_title || data?.ai_title || fileName}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  {/* ... rest of header buttons (connect, remove, dropdown) ... */}
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
                    {!canConnect &&
                      !isStatusPollingLoading &&
                      !processingState.isProcessing &&
                      uploadedAudio && (
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
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAudio();
                      }}
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
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleCopyTranscription}
                          className="cursor-pointer"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy transcription
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Processing Overlay */}
                {processingState.isProcessing && (
                  <div className="bg-purple-50 p-4 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">
                        Transcribing and analyzing audio...
                      </span>
                    </div>
                  </div>
                )}

                {/* Player Controls - Different UI for Recorded vs Uploaded */}
                <div className="p-4">
                  {fileName.includes("recording") ? (
                    // Recorded Audio - Cool Alternative UI without progress bar
                    <div className="space-y-4">
                      {/* Waveform-style Visualization */}
                      <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Button
                              size="icon"
                              className="rounded-full bg-purple-500 hover:bg-purple-600 text-white h-12 w-12 disabled:opacity-50"
                              onClick={togglePlayPause}
                              disabled={
                                isUploading || processingState.isProcessing
                              }
                            >
                              {isUploading ? (
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
                        {/* Cool Waveform-style Animation */}
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
                        {/* Recording Info */}
                        <div className="flex items-center justify-between mt-3 text-xs text-purple-600">
                          <span>🎙️ Recorded Audio</span>
                          <div className="flex items-center gap-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs px-2 py-1 h-6 min-w-[30px] border-purple-300 bg-transparent hover:bg-purple-50 text-purple-600"
                              onClick={cycleSpeed}
                              disabled={processingState.isProcessing}
                            >
                              {playbackSpeed}x
                            </Button>
                            <span>
                              Duration: {formatTime(recordingState.duration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Uploaded Audio - Normal Progress Bar UI
                    <div className="flex items-center gap-3 mb-4">
                      <Button
                        size="icon"
                        className="rounded-full bg-purple-500 hover:bg-purple-600 text-white h-10 w-10 disabled:opacity-50"
                        onClick={togglePlayPause}
                        disabled={isUploading || processingState.isProcessing}
                        // disabled={isLoading || processingState.isProcessing}
                      >
                        {isUploading ? (
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
                          disabled={processingState.isProcessing}
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
                        disabled={processingState.isProcessing}
                      >
                        {playbackSpeed}x
                      </Button>
                    </div>
                  )}

                  {/* Error State */}
                  {processingState.error && (
                    <div className="mb-4">
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
                  <AiNoteInput
                    color="purple"
                    note={userNotes}
                    setNote={(val) => setUserNotes(val ?? "")}
                    isLoading={isAnalyzing}
                    isInputDisabled={processingState.isProcessing}
                    isButtonDisabled={
                      processingState.isProcessing || isAnalyzing
                    }
                    onButtonClick={() => {
                      updateNodeData(data?.id, { ai_notes: userNotes });
                      analyzeAudioContent({
                        data: { ai_notes: userNotes },
                        strategyId: strategyId,
                        peerId: data?.id,
                      });
                    }}
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
