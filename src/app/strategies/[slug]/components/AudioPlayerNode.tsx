"use client";

import {
  useState,
  useRef,
  useEffect,
  type DragEvent,
  type ChangeEvent,
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
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  HelpCircle,
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
  const strategyId = useParams()?.slug as string;

  const nodeControlRef = useRef(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { setEdges } = useReactFlow();

  // Audio upload states
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
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

  const speeds = [1, 1.5, 2];

  // Handle pasted audio data from props (if needed)
  useEffect(() => {
    if (data?.pastedAudio && data?.pastedFileName) {
      setUploadedAudio(data.pastedAudio);
      setFileName(data.pastedFileName);
      processAudioWithAI(data.pastedAudio, data.pastedFileName);
    }
  }, [data]);

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
      // console.log("Audio metadata loaded, duration:", audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const newCurrentTime = audio.currentTime;
      // console.log("Time update:", newCurrentTime, "Duration:", audio.duration);
      setCurrentTime(newCurrentTime);

      // Double-check duration if it's not set
      if (audio.duration && !isNaN(audio.duration) && duration === 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      // console.log("Audio loading started");
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      // console.log("Audio can play");
      setIsLoading(false);
    };

    const handleError = (e: any) => {
      // console.error("Audio error:", e);
      setIsLoading(false);
    };

    const handleLoadedData = () => {
      // console.log("Audio data loaded");
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
        setIsLoading(false);
      }
    };

    // Add more event listeners for better compatibility
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    // Force load if audio source is set
    if (uploadedAudio) {
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

  // AI responses for different audio types
  const processAudio = (filename: string): AIProcessingResponse => {
    return {
      title: "Voice Recording Session",
      peerId: "peer_audio_rec_001",
      transcription:
        "This is a live recording session. I'm testing the audio quality and making sure everything sounds clear and professional.",
      summary:
        "Live voice recording with focus on audio quality testing and professional sound capture.",
      confidence: 0.96,
      tags: ["recording", "voice", "live", "quality test"],
      duration: recordingState.duration,
      language: "English",
    };
  };

  // AI Processing Function
  const processAudioWithAI = async (audioData: string, filename: string) => {
    setProcessingState({
      isProcessing: true,
      isComplete: false,
      error: null,
    });

    try {
      // Simulate API processing time (3-6 seconds for audio)
      const processingTime = Math.random() * 3000 + 3000;

      await new Promise((resolve) => setTimeout(resolve, processingTime));

      // Simulate occasional API errors (10% chance)
      // throw new Error("Audio transcription service temporarily unavailable")

      // Get AI response
      const result = processAudio(filename);

      // Update states with API response
      setAiResponse(result);
      setProcessingState({
        isProcessing: false,
        isComplete: true,
        error: null,
      });

      console.log("🎵 Audio AI Response:", result);
    } catch (error) {
      console.error("Audio AI Processing Error:", error);
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: error instanceof Error ? error.message : "Processing failed",
      });
    }
  };

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

      // Set up audio context for level monitoring
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

      // Clean up audio context
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
      const reader = new FileReader();

      reader.onload = (e) => {
        const audioData = e.target?.result as string;
        const filename = `recording-${Date.now()}.webm`;

        // Reset all audio states first
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setIsLoading(true);

        // Set the audio data
        setUploadedAudio(audioData);
        setFileName(filename);
        setShowRecordingInterface(false);

        // For recorded audio, we'll use a different approach - no duration needed
        setIsLoading(false);

        // Auto-process recorded audio
        processAudioWithAI(audioData, filename);
      };

      reader.readAsDataURL(blob);
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
      const reader = new FileReader();
      reader.onload = (e) => {
        const audioData = e.target?.result as string;
        setUploadedAudio(audioData);
        setFileName(file.name);
        // Auto-process uploaded audio
        processAudioWithAI(audioData, file.name);
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
    setUploadedAudio(null);
    setFileName("");
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNotesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserNotes(e.target.value);
  };

  const handleReprocess = () => {
    if (uploadedAudio && fileName) {
      processAudioWithAI(uploadedAudio, fileName);
    }
  };

  // Audio player controls
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log(
      "Toggle play/pause. Current time:",
      audio.currentTime,
      "Duration:",
      audio.duration
    );

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Ensure we have duration before playing
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
          <div className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden">
            {!uploadedAudio && !showRecordingInterface ? (
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
                    ) : aiResponse ? (
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-300" />
                        <span className="text-sm font-medium truncate">
                          {aiResponse.title}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        <span className="text-sm font-medium truncate">
                          {fileName}
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

                    {!canConnect &&
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
                      <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Button
                              size="icon"
                              className="rounded-full bg-purple-500 hover:bg-purple-600 text-white h-12 w-12 disabled:opacity-50"
                              onClick={togglePlayPause}
                              disabled={
                                isLoading || processingState.isProcessing
                              }
                            >
                              {isLoading ? (
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
                        disabled={isLoading || processingState.isProcessing}
                      >
                        {isLoading ? (
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
                  <div className="relative">
                    <Input
                      placeholder="Add notes for AI to use..."
                      value={userNotes}
                      onChange={handleNotesChange}
                      className="pr-8 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
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
