"use client"

import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from "react"
import { Handle, Position, useReactFlow } from "@xyflow/react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
    X,
    Plus,
    Upload,
    HelpCircle,
    Lightbulb,
    Loader2,
    Shield,
    CheckCircle,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Download,
    Eye,
    Clock,
    FileVideo,
    Maximize
} from "lucide-react"
import { cn } from "@/lib/utils"
import NodeWrapper from "./common/NodeWrapper"

// Types for AI integration
interface AIProcessingResponse {
    title: string
    peerId: string
    analysis: string
    transcript: string
    keyTopics: string[]
    sentiment: string
    videoMetrics: {
        duration: string
        format: string
        resolution: string
        frameRate: string
        bitrate: string
        audioChannels: string
    }
    confidence: number
    tags: string[]
    insights: string[]
}

interface ProcessingState {
    isProcessing: boolean
    isComplete: boolean
    error: string | null
}

interface VideoMetadata {
    duration: number
    size: number
    type: string
    lastModified: number
}

// Supported video formats
const SUPPORTED_VIDEO_FORMATS = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo', // .avi
    'video/x-ms-wmv',  // .wmv
    'video/x-flv',     // .flv
    'video/3gpp',      // .3gp
    'video/x-matroska' // .mkv
]

export default function VideoUploadNode({
    id,
    sourcePosition = Position.Left,
    targetPosition = Position.Right,
    data,
}: any) {
    const nodeControlRef = useRef(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const { setEdges } = useReactFlow()

    // Video states
    const [uploadedVideo, setUploadedVideo] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string>("")
    const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)

    // Video player states
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)

    // Processing states
    const [processingState, setProcessingState] = useState<ProcessingState>({
        isProcessing: false,
        isComplete: false,
        error: null,
    })

    // AI Response states
    const [aiResponse, setAiResponse] = useState<AIProcessingResponse | null>(null)
    const [userNotes, setUserNotes] = useState<string>("")

    // Handle pasted video data from props
    useEffect(() => {
        if (data?.pastedVideo && data?.pastedFileName) {
            setUploadedVideo(data.pastedVideo)
            setFileName(data.pastedFileName)
            // Auto-process pasted videos
            processVideoWithAI(data.pastedVideo, data.pastedFileName)
        }
    }, [data])

    // Mock AI responses for different video types
    const processVideo = (filename: string): AIProcessingResponse => {
        const extension = filename.split('.').pop()?.toLowerCase()

        const videoAnalyses = {
            mp4: {
                title: "Product Demo - Mobile App Walkthrough",
                analysis: "This video demonstrates a comprehensive mobile app interface with smooth transitions and clear user interactions. The content focuses on onboarding flow and key features presentation.",
                transcript: "Welcome to our mobile app. Let me show you the main features. First, you'll see the dashboard where all your data is organized. The navigation is intuitive with clear icons and labels...",
                keyTopics: ["Mobile App", "User Interface", "Product Demo", "Onboarding", "Navigation"],
                sentiment: "positive",
                insights: [
                    "Clear visual hierarchy in UI design",
                    "Smooth animation transitions enhance user experience",
                    "Effective use of color coding for different features"
                ]
            },
            webm: {
                title: "Training Video - Best Practices",
                analysis: "Educational content covering industry best practices with structured presentation and practical examples. High engagement potential for professional development.",
                transcript: "In today's session, we'll cover the essential best practices that every professional should know. These techniques have been proven effective across multiple industries...",
                keyTopics: ["Training", "Best Practices", "Professional Development", "Education", "Industry Standards"],
                sentiment: "neutral",
                insights: [
                    "Structured learning approach with clear objectives",
                    "Practical examples enhance comprehension",
                    "Professional presentation style maintains viewer attention"
                ]
            },
            mov: {
                title: "Creative Showcase - Brand Campaign",
                analysis: "High-quality creative content showcasing brand elements with professional cinematography and compelling visual storytelling.",
                transcript: "This brand represents innovation and quality. Through our journey, we've maintained our commitment to excellence while adapting to changing market needs...",
                keyTopics: ["Branding", "Creative", "Marketing", "Visual Storytelling", "Brand Identity"],
                sentiment: "positive",
                insights: [
                    "Strong brand messaging with emotional appeal",
                    "Professional cinematography enhances brand perception",
                    "Consistent visual language reinforces brand identity"
                ]
            },
            default: {
                title: "Video Content Analysis",
                analysis: "This video contains valuable content suitable for strategic analysis. The visual and audio elements provide rich data for AI processing and insights generation.",
                transcript: "The video presents information in a structured format with clear visual and audio cues that facilitate comprehensive analysis...",
                keyTopics: ["Content Analysis", "Video Processing", "Data Extraction", "Media Analysis"],
                sentiment: "neutral",
                insights: [
                    "Multi-modal content provides rich analysis opportunities",
                    "Structured presentation facilitates automated processing",
                    "Clear audio enables accurate transcription"
                ]
            }
        }

        const analysis = videoAnalyses[extension as keyof typeof videoAnalyses] || videoAnalyses.default

        return {
            title: analysis.title,
            peerId: `peer_${Math.random().toString(36).substr(2, 12)}`,
            analysis: analysis.analysis,
            transcript: analysis.transcript,
            keyTopics: analysis.keyTopics,
            sentiment: analysis.sentiment,
            videoMetrics: {
                duration: "2:34",
                format: extension?.toUpperCase() || "MP4",
                resolution: "1920x1080",
                frameRate: "30 fps",
                bitrate: "2.5 Mbps",
                audioChannels: "Stereo"
            },
            confidence: 0.91,
            tags: ["video", "content", "analysis", ...analysis.keyTopics.map(topic => topic.toLowerCase())],
            insights: analysis.insights
        }
    }

    // API Integration Function
    const processVideoWithAI = async (videoData: string, filename: string) => {
        setProcessingState({
            isProcessing: true,
            isComplete: false,
            error: null,
        })

        try {
            // Simulate API processing time (5-8 seconds for video processing)
            const processingTime = Math.random() * 3000 + 5000

            await new Promise((resolve) => setTimeout(resolve, processingTime))

            // Simulate occasional errors
            // if (Math.random() < 0.1) {
            //   throw new Error("Video processing service temporarily unavailable")
            // }

            // Get AI response
            const result = processVideo(filename)

            // Update states with API response
            setAiResponse(result)
            setProcessingState({
                isProcessing: false,
                isComplete: true,
                error: null,
            })

            console.log("🤖 AI Video Response:", result)
        } catch (error) {
            console.error("AI Video Processing Error:", error)
            setProcessingState({
                isProcessing: false,
                isComplete: false,
                error: error instanceof Error ? error.message : "Video processing failed",
            })
        }
    }

    // Video validation function
    const validateVideoFile = (file: File): { isValid: boolean; error?: string } => {
        // Check file size (max 500MB)
        const maxSize = 500 * 1024 * 1024 // 500MB
        if (file.size > maxSize) {
            return { isValid: false, error: "File size must be less than 500MB" }
        }

        // Check file type
        if (!SUPPORTED_VIDEO_FORMATS.includes(file.type)) {
            return { isValid: false, error: "Unsupported video format. Please use MP4, WebM, MOV, AVI, or other common video formats." }
        }

        return { isValid: true }
    }

    const handleFileSelect = (file: File) => {
        const validation = validateVideoFile(file)

        if (!validation.isValid) {
            setProcessingState({
                isProcessing: false,
                isComplete: false,
                error: validation.error || "Invalid video file"
            })
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const videoData = e.target?.result as string
            setUploadedVideo(videoData)
            setFileName(file.name)
            setVideoMetadata({
                duration: 0, // Will be set when video loads
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            })

            // Reset player states
            setIsPlaying(false)
            setCurrentTime(0)
            setDuration(0)

            // Auto-process uploaded videos
            processVideoWithAI(videoData, file.name)
        }
        reader.readAsDataURL(file)
    }

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    // Drag and drop handlers
    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isDragOver) setIsDragOver(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.currentTarget.contains(e.relatedTarget as Node)) {
            return
        }
        setIsDragOver(false)
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFileSelect(files[0])
        }
    }

    // Video player controls
    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleMuteToggle = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value)
        setVolume(newVolume)
        if (videoRef.current) {
            videoRef.current.volume = newVolume
        }
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime)
        }
    }

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const videoDuration = videoRef.current.duration
            // Handle WebM and other formats that might return invalid duration
            const validDuration = isFinite(videoDuration) && !isNaN(videoDuration) && videoDuration > 0 ? videoDuration : 0
            setDuration(validDuration)
            setVideoMetadata(prev => prev ? { ...prev, duration: validDuration } : null)
        }
    }

    const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value)
        setCurrentTime(time)
        if (videoRef.current) {
            videoRef.current.currentTime = time
        }
    }

    const formatTime = (seconds: number): string => {
        // Handle invalid duration values (WebM sometimes returns Infinity or NaN)
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
            return "0:00"
        }

        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleSelectFile = () => {
        fileInputRef.current?.click()
    }

    const handleRemoveVideo = () => {
        setUploadedVideo(null)
        setFileName("")
        setVideoMetadata(null)
        setAiResponse(null)
        setProcessingState({
            isProcessing: false,
            isComplete: false,
            error: null,
        })
        setUserNotes("")
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleNotesChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserNotes(e.target.value)
    }

    const handleReprocess = () => {
        if (uploadedVideo && fileName) {
            processVideoWithAI(uploadedVideo, fileName)
        }
    }

    const handleDownload = () => {
        if (uploadedVideo && fileName) {
            const link = document.createElement('a')
            link.href = uploadedVideo
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const handleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen()
            } else if ((videoRef.current as any).webkitRequestFullscreen) {
                // Safari fallback
                (videoRef.current as any).webkitRequestFullscreen()
            } else if ((videoRef.current as any).msRequestFullscreen) {
                // IE/Edge fallback
                (videoRef.current as any).msRequestFullscreen()
            }
        }
    }

    const progressValue = duration > 0 ? (currentTime / duration) * 100 : 0

    // Check if video is WebM format
    const isWebMVideo = fileName.toLowerCase().endsWith('.webm') || videoMetadata?.type === 'video/webm'

    // Determine if connection should be allowed
    const canConnect: any = processingState.isComplete && aiResponse && !processingState.error;

    // Remove connections when node becomes not connectable
    useEffect(() => {
        if (!canConnect) {
            setEdges((edges) =>
                edges.filter((edge) => edge.source !== id && edge.target !== id)
            )
        }
    }, [canConnect, id, setEdges])

    return (
        <>
            <NodeWrapper
                id={id}
                className="bg-white"
            >
                <div className="react-flow__node">
                    <div ref={nodeControlRef} className={`nodrag`} />

                    <TooltipProvider>
                        <div
                            className="w-[800px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden"
                            onWheel={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            {!uploadedVideo ? (
                                // Upload Interface
                                <div
                                    className={cn(
                                        "p-6 border-2 border-dashed rounded-lg transition-colors",
                                        isDragOver
                                            ? "border-blue-400 bg-blue-50"
                                            : "border-gray-300 hover:border-gray-400"
                                    )}
                                    onDragEnter={handleDragEnter}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="text-center space-y-4">
                                        <div className="mx-auto h-16 w-16 text-gray-400">
                                            <FileVideo className="h-full w-full" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                Upload Video File
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Drag and drop your video here, or click to browse
                                            </p>
                                            <Button
                                                onClick={handleSelectFile}
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Choose Video
                                            </Button>
                                        </div>
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <div>Supported formats: MP4, WebM, MOV, AVI, WMV, FLV, 3GP, MKV</div>
                                            <div>Maximum file size: 500MB</div>
                                        </div>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="video/*"
                                        onChange={handleFileInputChange}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                // Video Player Interface
                                <div className="space-y-4">
                                    {/* Header with AI Title or Processing State */}
                                    <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {processingState.isProcessing ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm font-medium">AI is analyzing your video...</span>
                                                </div>
                                            ) : processingState.error ? (
                                                <div className="flex items-center gap-2">
                                                    <X className="w-4 h-4 text-red-300" />
                                                    <span className="text-sm font-medium">Processing failed</span>
                                                </div>
                                            ) : aiResponse ? (
                                                <div className="flex items-center gap-2">
                                                    <FileVideo className="w-4 h-4" />
                                                    <span className="text-sm font-medium truncate">{aiResponse.title}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <FileVideo className="w-4 h-4" />
                                                    <span className="text-sm font-medium truncate">{fileName}</span>
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
                                                        <p className="text-sm">Ready to connect to other nodes</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}

                                            {!canConnect && !processingState.isProcessing && uploadedVideo && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Shield className="w-4 h-4 text-yellow-300" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-sm">Complete processing to enable connections</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>

                                    {/* Video Player */}
                                    <div className="px-4">
                                        <div className="relative bg-black rounded-lg overflow-hidden">
                                            <video
                                                ref={videoRef}
                                                src={uploadedVideo}
                                                className="w-full aspect-video object-contain"
                                                onTimeUpdate={handleTimeUpdate}
                                                onLoadedMetadata={handleLoadedMetadata}
                                                onPlay={() => setIsPlaying(true)}
                                                onPause={() => setIsPlaying(false)}
                                            />

                                            {/* Processing Overlay */}
                                            {processingState.isProcessing && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
                                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                                                        <span className="text-sm font-medium text-gray-700">Processing video...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Video Controls - Different UI for WebM vs Other Formats */}
                                        <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                                            {isWebMVideo ? (
                                                // WebM Video - Alternative UI without progress bar
                                                <div className="space-y-4">
                                                    {/* WebM-style Visualization */}
                                                    <div className="bg-gradient-to-r from-blue-100 to-purple-200 p-4 rounded-lg">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    onClick={handlePlayPause}
                                                                    size="icon"
                                                                    className="rounded-full bg-blue-500 hover:bg-blue-600 text-white h-12 w-12 disabled:opacity-50"
                                                                    disabled={processingState.isProcessing}
                                                                >
                                                                    {isPlaying ? (
                                                                        <Pause className="w-6 h-6 fill-white" />
                                                                    ) : (
                                                                        <Play className="w-6 h-6 fill-white" />
                                                                    )}
                                                                </Button>
                                                                <div className="text-left">
                                                                    <div className="text-sm font-medium text-blue-700">WebM Video</div>
                                                                    <div className="text-xs text-blue-600">{isPlaying ? "Playing..." : "Ready to play"}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-blue-700 tabular-nums">
                                                                    {formatTime(currentTime)}
                                                                </div>
                                                                <div className="text-xs text-blue-600">Elapsed</div>
                                                            </div>
                                                        </div>

                                                        {/* Cool Animation Bars */}
                                                        <div className="flex items-center justify-center gap-1 h-12 bg-white/50 rounded-lg p-2">
                                                            {Array.from({ length: 40 }, (_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={cn(
                                                                        "w-1 rounded-full transition-all duration-150",
                                                                        isPlaying ? "bg-blue-500 animate-pulse" : "bg-blue-300",
                                                                    )}
                                                                    style={{
                                                                        height: `${Math.max(4, Math.random() * 32 + (isPlaying ? Math.sin(Date.now() / 100 + i) * 8 : 0))}px`,
                                                                        animationDelay: `${i * 50}ms`,
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>

                                                        {/* WebM Controls */}
                                                        <div className="flex items-center justify-between mt-3 text-xs text-blue-600">
                                                            <span>🎥 WebM Format</span>
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    onClick={handleMuteToggle}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-blue-300 bg-transparent hover:bg-blue-50 text-blue-600"
                                                                    disabled={processingState.isProcessing}
                                                                >
                                                                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons for WebM */}
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    onClick={handleDownload}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={processingState.isProcessing}
                                                                >
                                                                    <Download className="w-4 h-4 mr-2" />
                                                                    Download
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-sm">Download WebM video</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    onClick={handleFullscreen}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={processingState.isProcessing}
                                                                >
                                                                    <Maximize className="w-4 h-4 mr-2" />
                                                                    Fullscreen
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-sm">View fullscreen</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <Button
                                                            onClick={handleRemoveVideo}
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={processingState.isProcessing}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Other Video Formats - Normal Progress Bar UI
                                                <div className="space-y-3">
                                                    {/* Playback Progress with Slider */}
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-500 w-12">{formatTime(currentTime)}</span>
                                                        <div className="flex-1">
                                                            <Slider
                                                                value={[progressValue]}
                                                                max={100}
                                                                step={0.1}
                                                                onValueChange={(value) => {
                                                                    const newTime = (value[0] / 100) * duration
                                                                    setCurrentTime(newTime)
                                                                    if (videoRef.current) {
                                                                        videoRef.current.currentTime = newTime
                                                                    }
                                                                }}
                                                                className="w-full [&>span:first-child]:h-2 [&>span:first-child]:bg-blue-200 [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-blue-500"
                                                                disabled={processingState.isProcessing}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500 w-12">{formatTime(duration)}</span>
                                                    </div>

                                                    {/* Control Buttons */}
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            onClick={handlePlayPause}
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={processingState.isProcessing}
                                                        >
                                                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                        </Button>

                                                        <Button
                                                            onClick={handleMuteToggle}
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={processingState.isProcessing}
                                                        >
                                                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                                        </Button>

                                                        <div className="flex items-center gap-2 flex-1">
                                                            <Slider
                                                                value={[volume * 100]}
                                                                max={100}
                                                                step={10}
                                                                onValueChange={(value) => {
                                                                    const newVolume = value[0] / 100
                                                                    setVolume(newVolume)
                                                                    if (videoRef.current) {
                                                                        videoRef.current.volume = newVolume
                                                                    }
                                                                }}
                                                                className="w-20 [&>span:first-child]:h-2 [&>span:first-child]:bg-gray-200 [&_[role=slider]]:bg-gray-500 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-gray-500"
                                                                disabled={processingState.isProcessing}
                                                            />
                                                        </div>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    onClick={handleDownload}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={processingState.isProcessing}
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-sm">Download video</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    onClick={handleFullscreen}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={processingState.isProcessing}
                                                                >
                                                                    <Maximize className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-sm">View fullscreen</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <Button
                                                            onClick={handleRemoveVideo}
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={processingState.isProcessing}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Video Metadata */}
                                            {videoMetadata && (
                                                <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="text-left">Size: {formatFileSize(videoMetadata.size)}</div>
                                                        <div className="text-right">Format: {videoMetadata.type.split('/')[1].toUpperCase()}</div>
                                                        {!isWebMVideo && duration > 0 && <div className="text-left">Duration: {formatTime(duration)}</div>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Error State */}
                                    {processingState.error && (
                                        <div className="px-4">
                                            <div className="bg-red-50 p-3 rounded-lg">
                                                <div className="text-xs text-red-600 font-medium mb-1">Processing Error</div>
                                                <div className="text-sm text-red-700 mb-2">{processingState.error}</div>
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
                                    <div className="px-4 pb-4">
                                        <div className="relative">
                                            <Input
                                                placeholder="Add notes for AI to use..."
                                                value={userNotes}
                                                onChange={handleNotesChange}
                                                className="pr-8 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
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
                                                        Add notes that will be used by AI to provide better context and analysis
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TooltipProvider>

                    <Handle position={sourcePosition} type="source" isConnectableEnd={canConnect} isConnectable={canConnect} isConnectableStart={canConnect} style={{ width: "30px", height: "30px" }} />
                </div>
            </NodeWrapper>
        </>
    )
}
