"use client"

import type React from "react"

import { useState, useRef, useEffect, type ChangeEvent } from "react"
import { Handle, Position } from "@xyflow/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types for AI integration
interface AIProcessingResponse {
  title: string
  peerId: string
  summary: string
  keyPoints: string[]
  sentiment: string
  confidence: number
  tags: string[]
  wordCount: number
  language: string
  contentType: string
}

interface ProcessingState {
  isProcessing: boolean
  isComplete: boolean
  error: string | null
}

interface WebsiteData {
  url: string
  title: string
  content: string
  favicon: string
  screenshot: string
}

export default function RemoteNode({ id, sourcePosition = Position.Left, targetPosition = Position.Right, data }: any) {
  const nodeControlRef = useRef(null)

  // Website states
  const [websiteUrl, setWebsiteUrl] = useState<string>("")
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null)
  const [isValidUrl, setIsValidUrl] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Processing states
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isComplete: false,
    error: null,
  })

  // AI Response states
  const [aiResponse, setAiResponse] = useState<AIProcessingResponse | null>(null)
  const [userNotes, setUserNotes] = useState<string>("")

  // Handle pasted URL data from props (if needed)
  useEffect(() => {
    if (data?.pastedUrl) {
      setWebsiteUrl(data.pastedUrl)
      handleUrlSubmit(data.pastedUrl)
    }
  }, [data])

  // URL validation
  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`)
      return urlObj.protocol === "http:" || urlObj.protocol === "https:"
    } catch {
      return false
    }
  }

  // Update URL validation on input change
  useEffect(() => {
    setIsValidUrl(websiteUrl.trim() !== "" && validateUrl(websiteUrl))
  }, [websiteUrl])

  // Fake website data responses
  const getFakeWebsiteData = (url: string): WebsiteData => {
    const websites = [
      {
        url: url,
        title: "OpenAI - Artificial Intelligence Research",
        content:
          "OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity. We conduct cutting-edge research in machine learning and AI safety.",
        favicon: "🤖",
        screenshot: "/placeholder.svg?height=200&width=400",
      },
      {
        url: url,
        title: "TechCrunch - Technology News & Startup Information",
        content:
          "TechCrunch is a leading technology media property, dedicated to obsessively profiling startups, reviewing new Internet products, and breaking tech news. Stay updated with the latest in technology.",
        favicon: "📱",
        screenshot: "/placeholder.svg?height=200&width=400",
      },
      {
        url: url,
        title: "GitHub - Where the world builds software",
        content:
          "GitHub is where over 100 million developers shape the future of software, together. Contribute to the open source community, manage Git repositories, and build software alongside millions of developers.",
        favicon: "🐙",
        screenshot: "/placeholder.svg?height=200&width=400",
      },
      {
        url: url,
        title: "Stack Overflow - Developer Community",
        content:
          "Stack Overflow is the largest, most trusted online community for developers to learn, share their programming knowledge, and build their careers. Get answers to your coding questions.",
        favicon: "📚",
        screenshot: "/placeholder.svg?height=200&width=400",
      },
    ]

    // Select response based on URL hash for consistency
    const hash = url.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    return websites[Math.abs(hash) % websites.length]
  }

  // Fake AI responses for different website types
  const getFakeAIResponse = (websiteData: WebsiteData): AIProcessingResponse => {
    const responses = [
      {
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
      },
      {
        title: "Technology News & Startup Coverage",
        peerId: "peer_web_3a5b7c9d1e",
        summary:
          "A comprehensive technology news platform covering startup ecosystems, product launches, and industry trends with in-depth analysis and expert commentary.",
        keyPoints: [
          "Latest technology news and updates",
          "Startup funding and acquisition coverage",
          "Product reviews and analysis",
          "Industry trend predictions",
        ],
        sentiment: "Neutral",
        confidence: 0.91,
        tags: ["news", "technology", "startups", "business"],
        wordCount: 1243,
        language: "English",
        contentType: "News/Media",
      },
      {
        title: "Developer Platform & Code Repository",
        peerId: "peer_web_8f2h4j6k9m",
        summary:
          "A collaborative development platform that hosts code repositories, facilitates version control, and enables developers to work together on software projects.",
        keyPoints: [
          "Version control and code hosting",
          "Collaborative development tools",
          "Open source project management",
          "Developer community features",
        ],
        sentiment: "Positive",
        confidence: 0.89,
        tags: ["development", "coding", "collaboration", "open source"],
        wordCount: 692,
        language: "English",
        contentType: "Development/Tools",
      },
      {
        title: "Developer Q&A Community",
        peerId: "peer_web_5n7p9r2t4v",
        summary:
          "A question-and-answer platform for programmers and developers to share knowledge, solve coding problems, and learn from the community.",
        keyPoints: [
          "Programming Q&A community",
          "Code problem solving",
          "Knowledge sharing platform",
          "Developer skill building",
        ],
        sentiment: "Positive",
        confidence: 0.92,
        tags: ["programming", "community", "learning", "Q&A"],
        wordCount: 534,
        language: "English",
        contentType: "Community/Education",
      },
    ]

    // Select response based on website content hash
    const hash = websiteData.content.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    return responses[Math.abs(hash) % responses.length]
  }

  // Fake website fetching and AI processing
  const processWebsiteWithAI = async (url: string) => {
    setProcessingState({
      isProcessing: true,
      isComplete: false,
      error: null,
    })

    try {
      // Simulate website fetching time (2-4 seconds)
      const fetchingTime = Math.random() * 2000 + 2000

      await new Promise((resolve) => setTimeout(resolve, fetchingTime))

      // Simulate occasional fetch errors (15% chance)
      if (Math.random() < 0.15) {
        throw new Error("Failed to fetch website content. Please check the URL and try again.")
      }

      // Get fake website data
      const websiteData = getFakeWebsiteData(url)
      setWebsiteData(websiteData)

      // Simulate AI processing time (2-3 seconds)
      const processingTime = Math.random() * 1000 + 2000

      await new Promise((resolve) => setTimeout(resolve, processingTime))

      // Get fake AI response
      const result = getFakeAIResponse(websiteData)

      // Update states with fake API response
      setAiResponse(result)
      setProcessingState({
        isProcessing: false,
        isComplete: true,
        error: null,
      })

      console.log("🌐 Website AI Response:", result)
    } catch (error) {
      console.error("Website AI Processing Error:", error)
      setProcessingState({
        isProcessing: false,
        isComplete: false,
        error: error instanceof Error ? error.message : "Processing failed",
      })
    }
  }

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWebsiteUrl(e.target.value)
  }

  const handleUrlSubmit = (urlToSubmit?: string) => {
    const url = urlToSubmit || websiteUrl
    if (!url.trim() || !validateUrl(url)) return

    const formattedUrl = url.startsWith("http") ? url : `https://${url}`
    setWebsiteUrl(formattedUrl)
    processWebsiteWithAI(formattedUrl)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleUrlSubmit()
    }
  }

  const handleRemoveWebsite = () => {
    setWebsiteUrl("")
    setWebsiteData(null)
    setAiResponse(null)
    setProcessingState({
      isProcessing: false,
      isComplete: false,
      error: null,
    })
    setUserNotes("")
  }

  const handleNotesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserNotes(e.target.value)
  }

  const handleReprocess = () => {
    if (websiteUrl) {
      processWebsiteWithAI(websiteUrl)
    }
  }

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
`

      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `website-analysis-${Date.now()}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  const handleCopySummary = () => {
    const summary = aiResponse?.summary || "No analysis available"
    navigator.clipboard.writeText(summary)
    console.log("Copied summary to clipboard")
  }

  const handleVisitWebsite = () => {
    if (websiteData?.url) {
      window.open(websiteData.url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <TooltipProvider>
      <div className="react-flow__node">
        <div ref={nodeControlRef} className={`nodrag`} />

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
                <ExternalLink className="w-4 h-4" />
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
                      isValidUrl && "border-green-400 focus:border-green-500 focus:ring-green-500",
                      websiteUrl && !isValidUrl && "border-red-400 focus:border-red-500 focus:ring-red-500",
                    )}
                    disabled={processingState.isProcessing}
                  />
                  <Button
                    onClick={() => handleUrlSubmit()}
                    size="sm"
                    disabled={!isValidUrl || processingState.isProcessing}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full w-8 h-8 p-0"
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
                  <div className="flex items-center gap-2 text-sm">
                    {isValidUrl ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Valid URL</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-600">Please enter a valid URL</span>
                      </>
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
                    <div className="text-xs text-red-600 font-medium mb-1">Processing Error</div>
                    <div className="text-sm text-red-700 mb-2">{processingState.error}</div>
                    <Button
                      onClick={handleReprocess}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                    >
                      Retry
                    </Button>
                  </div>
                )}

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
                        Add notes that will be used by AI to provide better context and insights
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
                      <span className="text-sm font-medium">AI is analyzing website...</span>
                    </div>
                  ) : processingState.error ? (
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium">Analysis failed</span>
                    </div>
                  ) : aiResponse ? (
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-300" />
                      <span className="text-sm font-medium truncate">{aiResponse.title}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-medium truncate">{websiteData.title}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
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
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
                        <Download className="w-4 h-4 mr-2" />
                        Download analysis
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopySummary} className="cursor-pointer">
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
                      <div className="text-sm font-medium text-gray-800 truncate">{websiteData.title}</div>
                      <div className="text-xs text-gray-500 truncate">{websiteData.url}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">{websiteData.content}</div>
                </div>
              </div>

              {/* Processing Overlay */}
              {processingState.isProcessing && (
                <div className="px-4 py-2">
                  <div className="bg-cyan-50 p-3 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                    <span className="text-sm font-medium text-cyan-700">Analyzing website content...</span>
                  </div>
                </div>
              )}

              {/* AI Response Details */}
              {aiResponse && processingState.isComplete && (
                <div className="px-4 py-2">
                  <div className="bg-cyan-50 p-3 rounded-lg space-y-3">
                    <div className="text-xs text-cyan-600 font-medium">AI Analysis Complete</div>

                    <div>
                      <div className="text-sm text-gray-700 font-medium mb-1">Summary:</div>
                      <div className="text-sm text-gray-600 leading-relaxed">{aiResponse.summary}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-700 font-medium mb-1">Key Points:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {aiResponse.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-cyan-500 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Sentiment: {aiResponse.sentiment}</span>
                      <span>•</span>
                      <span>Confidence: {Math.round(aiResponse.confidence * 100)}%</span>
                      <span>•</span>
                      <span>Words: {aiResponse.wordCount}</span>
                      <span>•</span>
                      <span>{aiResponse.language}</span>
                    </div>

                    {aiResponse.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {aiResponse.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error State */}
              {processingState.error && (
                <div className="px-4 py-2">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-xs text-red-600 font-medium mb-1">Analysis Error</div>
                    <div className="text-sm text-red-700 mb-2">{processingState.error}</div>
                    <Button
                      onClick={handleReprocess}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
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
                        Add notes that will be used by AI to provide better context and insights
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </div>

        <Handle position={sourcePosition} type="source" style={{ width: "30px", height: "30px" }} />
      </div>
    </TooltipProvider>
  )
}
