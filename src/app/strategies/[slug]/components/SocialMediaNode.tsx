"use client"

import { useState, useRef, useEffect, type ChangeEvent } from "react"
import { Handle, Position, useReactFlow } from "@xyflow/react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    X,
    ArrowRight,
    HelpCircle,
    Loader2,
    Shield,
    CheckCircle,
    Play,
    ExternalLink,
    Download,
    Eye,
    Share,
    Heart,
    MessageCircle,
    Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import NodeWrapper from "./common/NodeWrapper"

// Types for AI integration
interface AIProcessingResponse {
    title: string
    peerId: string
    description: string
    transcript: string
    keyTopics: string[]
    sentiment: string
    engagement: {
        views: number
        likes: number
        comments: number
        shares: number
    }
    metadata: {
        duration: string
        platform: string
        author: string
        publishedAt: string
        language: string
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

interface SocialMediaData {
    url: string
    platform: string
    videoId: string
    thumbnail: string
    title: string
    author: string
    duration: string
}

interface URLValidationResult {
    isValid: boolean
    platform?: string
    error?: string
    warning?: string
}

// Supported platforms with their URL patterns and branding
const SUPPORTED_PLATFORMS = {
    instagram: {
        name: 'Instagram',
        icon: '📷',
        color: 'from-purple-500 to-pink-500',
        textColor: 'text-purple-600',
        patterns: [
            /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+/,
            /^https?:\/\/(www\.)?instagram\.com\/stories\/[a-zA-Z0-9_.]+\/[0-9]+/
        ]
    },
    youtube: {
        name: 'YouTube',
        icon: '🎥',
        color: 'from-red-500 to-red-600',
        textColor: 'text-red-600',
        patterns: [
            /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/,
            /^https?:\/\/(www\.)?youtu\.be\/[a-zA-Z0-9_-]+/,
            /^https?:\/\/(www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]+/
        ]
    },
    tiktok: {
        name: 'TikTok',
        icon: '🎵',
        color: 'from-black to-gray-800',
        textColor: 'text-gray-800',
        patterns: [
            /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/video\/[0-9]+/,
            /^https?:\/\/(vm\.)?tiktok\.com\/[a-zA-Z0-9]+/
        ]
    },
    facebook: {
        name: 'Facebook',
        icon: '📘',
        color: 'from-blue-600 to-blue-700',
        textColor: 'text-blue-600',
        patterns: [
            /^https?:\/\/(www\.)?facebook\.com\/watch\/\?v=[0-9]+/,
            /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9.]+\/videos\/[0-9]+/,
            /^https?:\/\/(www\.)?fb\.watch\/[a-zA-Z0-9_-]+/
        ]
    }
}

export default function SocialMediaNode({
    id,
    sourcePosition = Position.Left,
    targetPosition = Position.Right,
    data,
}: any) {
    const nodeControlRef = useRef(null)
    const { setEdges } = useReactFlow()

    // URL and validation states
    const [socialUrl, setSocialUrl] = useState<string>("")
    const [urlValidation, setUrlValidation] = useState<URLValidationResult>({ isValid: false })
    const [isLoading, setIsLoading] = useState<boolean>(false)

    // Video data states
    const [socialMediaData, setSocialMediaData] = useState<SocialMediaData | null>(null)

    // Processing states
    const [processingState, setProcessingState] = useState<ProcessingState>({
        isProcessing: false,
        isComplete: false,
        error: null,
    })

    // AI Response states
    const [aiResponse, setAiResponse] = useState<AIProcessingResponse | null>(null)
    const [userNotes, setUserNotes] = useState<string>("")

    // Handle pasted URL data from props
    useEffect(() => {
        if (data?.pastedUrl) {
            setSocialUrl(data.pastedUrl)
            handleUrlValidation(data.pastedUrl)
        }
    }, [data])

    // URL validation function
    const validateSocialMediaUrl = (url: string): URLValidationResult => {
        if (!url.trim()) {
            return { isValid: false, error: "Please enter a URL" }
        }

        // Check if it's a valid URL format
        try {
            new URL(url)
        } catch {
            return { isValid: false, error: "Please enter a valid URL" }
        }

        // Check against supported platforms
        for (const [platform, config] of Object.entries(SUPPORTED_PLATFORMS)) {
            if (config.patterns.some(pattern => pattern.test(url))) {
                return { isValid: true, platform }
            }
        }

        return {
            isValid: false,
            error: "Unsupported platform. Please use Instagram, YouTube, TikTok, or Facebook video URLs."
        }
    }

    // Mock social media data extraction
    const extractVideoData = (url: string, platform: string): SocialMediaData => {
        const platformConfig = SUPPORTED_PLATFORMS[platform as keyof typeof SUPPORTED_PLATFORMS]

        // Generate mock video data based on platform
        const mockData = {
            instagram: {
                videoId: "CXyZ123abc",
                thumbnail: "https://scontent-lax3-2.cdninstagram.com/v/t51.2885-15/placeholder-reel-thumbnail.jpg",
                title: "Amazing sunset timelapse from rooftop 🌅✨",
                author: "@creator_username",
                duration: "0:15"
            },
            youtube: {
                videoId: "dQw4w9WgXcQ",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                title: "How to Build Effective Business Strategies in 2024",
                author: "Business Growth Channel",
                duration: "12:45"
            },
            tiktok: {
                videoId: "7234567890123456789",
                thumbnail: "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/placeholder-video-cover.jpeg",
                title: "Quick productivity tips that actually work! #productivity #tips",
                author: "@productivityguru",
                duration: "0:30"
            },
            facebook: {
                videoId: "1234567890123456",
                thumbnail: "https://scontent-lax3-1.xx.fbcdn.net/v/placeholder-video-thumbnail.jpg",
                title: "Team building activities that boost workplace morale",
                author: "Corporate Training Solutions",
                duration: "8:20"
            }
        }

        const data = mockData[platform as keyof typeof mockData]

        return {
            url,
            platform,
            videoId: data.videoId,
            thumbnail: data.thumbnail,
            title: data.title,
            author: data.author,
            duration: data.duration
        }
    }

    // Mock AI processing function
    const processVideoContent = (videoData: SocialMediaData): AIProcessingResponse => {
        const platformConfig = SUPPORTED_PLATFORMS[videoData.platform as keyof typeof SUPPORTED_PLATFORMS]

        return {
            title: videoData.title,
            peerId: `peer_${Math.random().toString(36).substr(2, 12)}`,
            description: `AI-analyzed content from ${platformConfig.name} video discussing business strategies, productivity tips, and professional development insights.`,
            transcript: "The video discusses key strategies for business growth, including market analysis, customer engagement, and digital transformation. The content covers practical implementation steps and real-world examples.",
            keyTopics: [
                "Business Strategy",
                "Digital Marketing",
                "Customer Engagement",
                "Growth Tactics",
                "Market Analysis"
            ],
            sentiment: "positive",
            engagement: {
                views: Math.floor(Math.random() * 1000000) + 10000,
                likes: Math.floor(Math.random() * 50000) + 1000,
                comments: Math.floor(Math.random() * 5000) + 100,
                shares: Math.floor(Math.random() * 10000) + 50
            },
            metadata: {
                duration: videoData.duration,
                platform: platformConfig.name,
                author: videoData.author,
                publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                language: "English"
            },
            confidence: 0.89,
            tags: ["business", "strategy", "productivity", "growth", "marketing"],
            insights: [
                "High engagement rate indicates viral potential",
                "Content resonates well with business audience",
                "Educational format drives strong retention"
            ]
        }
    }

    // API Integration Function
    const processSocialMediaWithAI = async (videoData: SocialMediaData) => {
        setProcessingState({
            isProcessing: true,
            isComplete: false,
            error: null,
        })

        try {
            // Simulate API processing time (2-5 seconds for social media)
            const processingTime = Math.random() * 3000 + 2000

            await new Promise((resolve) => setTimeout(resolve, processingTime))

            // Simulate occasional errors
            // if (Math.random() < 0.1) {
            //   throw new Error("Social media processing service temporarily unavailable")
            // }

            // Get AI response
            const result = processVideoContent(videoData)

            // Update states with API response
            setAiResponse(result)
            setProcessingState({
                isProcessing: false,
                isComplete: true,
                error: null,
            })

            console.log("🤖 AI Social Media Response:", result)
        } catch (error) {
            console.error("AI Social Media Processing Error:", error)
            setProcessingState({
                isProcessing: false,
                isComplete: false,
                error: error instanceof Error ? error.message : "Social media processing failed",
            })
        }
    }

    const handleUrlValidation = (url: string) => {
        const validation = validateSocialMediaUrl(url)
        setUrlValidation(validation)
    }

    const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value
        setSocialUrl(url)
        handleUrlValidation(url)
    }

    const handleProcessUrl = async () => {
        if (!urlValidation.isValid || !urlValidation.platform) return

        setIsLoading(true)

        try {
            // Simulate URL processing time
            await new Promise((resolve) => setTimeout(resolve, 1500))

            // Extract video data
            const videoData = extractVideoData(socialUrl, urlValidation.platform)
            setSocialMediaData(videoData)

            // Auto-process with AI
            processSocialMediaWithAI(videoData)

            setIsLoading(false)
        } catch (error) {
            setIsLoading(false)
            setUrlValidation({
                isValid: false,
                error: "Failed to process URL. Please try again."
            })
        }
    }

    const handleReset = () => {
        setSocialUrl("")
        setSocialMediaData(null)
        setUrlValidation({ isValid: false })
        setAiResponse(null)
        setProcessingState({
            isProcessing: false,
            isComplete: false,
            error: null,
        })
        setUserNotes("")
        setIsLoading(false)
    }

    const handleNotesChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserNotes(e.target.value)
    }

    const handleReprocess = () => {
        if (socialMediaData) {
            processSocialMediaWithAI(socialMediaData)
        }
    }

    const handleOpenOriginal = () => {
        if (socialMediaData) {
            window.open(socialMediaData.url, '_blank', 'noopener,noreferrer')
        }
    }

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M'
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K'
        }
        return num.toString()
    }

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

    const currentPlatform = socialMediaData ? SUPPORTED_PLATFORMS[socialMediaData.platform as keyof typeof SUPPORTED_PLATFORMS] : null

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
                            className="w-[1000px] max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden"
                            onWheel={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            {!socialMediaData ? (
                                // URL Input Interface
                                <div className="p-6 space-y-4">
                                    <div className="text-center mb-6">
                                        <div className="flex justify-center space-x-2 mb-4">
                                            {Object.values(SUPPORTED_PLATFORMS).map((platform, index) => (
                                                <div key={index} className="text-2xl">{platform.icon}</div>
                                            ))}
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            Add Social Media Video
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Enter a URL from Instagram, YouTube, TikTok, or Facebook
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
                                                    <div className={cn(
                                                        "text-xs px-2 py-1 rounded-full font-medium",
                                                        `bg-gradient-to-r ${SUPPORTED_PLATFORMS[urlValidation.platform as keyof typeof SUPPORTED_PLATFORMS].color} text-white`
                                                    )}>
                                                        {SUPPORTED_PLATFORMS[urlValidation.platform as keyof typeof SUPPORTED_PLATFORMS].name}
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
                                            onClick={handleProcessUrl}
                                            disabled={!urlValidation.isValid || isLoading}
                                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Processing URL...
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowRight className="w-4 h-4 mr-2" />
                                                    Process Video
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="text-xs text-gray-500 space-y-1">
                                        <div className="font-medium">Supported platforms:</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.values(SUPPORTED_PLATFORMS).map((platform, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <span>{platform.icon}</span>
                                                    <span>{platform.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Video Preview Interface
                                <div className="space-y-4">
                                    {/* Header with AI Title or Processing State */}
                                    <div className={cn(
                                        "px-4 py-3 flex items-center justify-between",
                                        currentPlatform ? `bg-gradient-to-r ${currentPlatform.color} text-white` : "bg-gray-100"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            {processingState.isProcessing ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm font-medium">AI is analyzing your video...</span>
                                                </div>
                                            ) : processingState.error ? (
                                                <div className="flex items-center gap-2">
                                                    <X className="w-4 h-4 text-red-500" />
                                                    <span className="text-sm font-medium text-red-700">Processing failed</span>
                                                </div>
                                            ) : aiResponse ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{currentPlatform?.icon}</span>
                                                    <span className="text-sm font-medium truncate">{aiResponse.title}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{currentPlatform?.icon}</span>
                                                    <span className="text-sm font-medium truncate">{socialMediaData.title}</span>
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

                                            {!canConnect && !processingState.isProcessing && socialMediaData && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Shield className="w-4 h-4 text-yellow-300" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-sm">Complete analysis to enable connections</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>

                                    {/* Video Preview */}
                                    <div className="px-4">
                                        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                                            <img
                                                src={socialMediaData.thumbnail}
                                                alt="Video thumbnail"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to gradient background if thumbnail fails to load
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                    target.parentElement!.style.background = currentPlatform ?
                                                        `linear-gradient(135deg, ${currentPlatform.color.replace('from-', '').replace(' to-', ', ')})` :
                                                        'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                                }}
                                            />

                                            {/* Play overlay */}
                                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                                <Button
                                                    onClick={handleOpenOriginal}
                                                    size="lg"
                                                    className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 rounded-full h-16 w-16 p-0"
                                                >
                                                    <Play className="w-6 h-6 ml-1" />
                                                </Button>
                                            </div>
                                            {/* Processing Overlay */}
                                            {processingState.isProcessing && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
                                                        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                                                        <span className="text-sm font-medium text-gray-700">Processing...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Video metadata */}
                                        <div className="mt-4 space-y-3">
                                            {/* Action buttons */}
                                            <div className="flex items-center gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            onClick={handleOpenOriginal}
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1"
                                                        >
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            Open Original
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-sm">View on {currentPlatform?.name}</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Button
                                                    onClick={handleReset}
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8 w-8 p-0"
                                                    disabled={processingState.isProcessing}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
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
                                                className="pr-8 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
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
                                                        Add notes that will be used by AI to provide better context and insights
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
