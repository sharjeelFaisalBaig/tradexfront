"use client"

import type React from "react"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { useReactFlow } from "@xyflow/react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { X, Edit3, Save, Trash2, MessageSquare, User, Clock, Palette, Loader2, Maximize, Minimize } from "lucide-react"
import { cn, showAPIErrorToast } from "@/lib/utils"
import { useNodeOperations } from "../hooks/useNodeOperations"
import { useParams } from "next/navigation"
import { useUpdateAnnotationContent } from "@/hooks/strategy/useStrategyMutations"
import useSuccessNotifier from "@/hooks/useSuccessNotifier"

interface AnnotationNodeData {
  id?: string
  annotation_message?: string
  created_at?: string
  updated_at?: string
  dataToAutoUpload?: { data?: any }
  data?: {
    color?: keyof typeof themes
  }
}

interface AnnotationNodeProps {
  id: string
  data: AnnotationNodeData
  selected?: boolean
}

// Theme configurations
const themes = {
  default: {
    name: "Default",
    bg: "bg-white",
    border: "border-gray-200",
    text: "text-gray-900",
    accent: "text-gray-600",
    button: "text-gray-400 hover:text-gray-600",
  },
  yellow: {
    name: "Yellow",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-900",
    accent: "text-yellow-700",
    button: "text-yellow-400 hover:text-yellow-600",
  },
  blue: {
    name: "Blue",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-900",
    accent: "text-blue-700",
    button: "text-blue-400 hover:text-blue-600",
  },
  green: {
    name: "Green",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-900",
    accent: "text-green-700",
    button: "text-green-400 hover:text-green-600",
  },
  purple: {
    name: "Purple",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-900",
    accent: "text-purple-700",
    button: "text-purple-400 hover:text-purple-600",
  },
  red: {
    name: "Red",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-900",
    accent: "text-red-700",
    button: "text-red-400 hover:text-red-600",
  },
}

export default function AnnotationNode({ id, data, selected }: AnnotationNodeProps) {
  const strategyId = useParams()?.slug as string
  const successNote = useSuccessNotifier()

  const { deleteNode } = useNodeOperations()
  const { updateNodeData, deleteElements } = useReactFlow()
  const { mutate: updateAnnotation, isPending: isUpdating } = useUpdateAnnotationContent()

  // State management
  const [nodeData, setNodeData] = useState<AnnotationNodeData | any>(data)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [isEditing, setIsEditing] = useState(!data?.annotation_message)
  const [content, setContent] = useState(data?.annotation_message || "")
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>(data?.data?.color || "default")
  const [dimensions, setDimensions] = useState({ width: 380, height: 200 })

  // Refs
  const isAutoUploadProcessedRef = useRef(false)
  const nodeRef = useRef<HTMLDivElement | any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fullscreenElementRef = useRef<HTMLDivElement>(null)

  // Get current theme config
  const theme = themes[currentTheme]

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content, isEditing])

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(content.length, content.length)
    }
  }, [isEditing])

  // Fullscreen functionality
  const toggleFullscreen = () => {
    const element = fullscreenElementRef.current
    const noteContainer = nodeRef.current
    if (!element) {
      return
    }

    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => {
            if (noteContainer) {
              noteContainer.style.width = "380px"
              noteContainer.style.height = "auto"
              noteContainer.style.borderRadius = "0.5rem"
              noteContainer.style.boxShadow = "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
            }
          })
          .catch((err) => {
            console.error("Failed to exit fullscreen mode:", err)
          })
      }
    } else {
      if (element.requestFullscreen) {
        element
          .requestFullscreen()
          .then(() => {
            if (noteContainer) {
              noteContainer.style.width = "100vw"
              noteContainer.style.height = "100vh"
              noteContainer.style.borderRadius = "0"
              noteContainer.style.boxShadow = "none"
            }
          })
          .catch((err) => {
            console.error("Failed to enable fullscreen mode:", err)
          })
      }
    }
  }

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const noteContainer = nodeRef.current
        if (noteContainer) {
          setDimensions({ width: 380, height: 200 })
          noteContainer.style.width = "380px"
          noteContainer.style.height = "auto"
          noteContainer.style.borderRadius = "0.5rem"
          noteContainer.style.boxShadow = "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
        }
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Get formatted timestamp
  const getFormattedTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Handle saving annotation
  const handleSave = () => {
    handleUpdateAnnotationNode({})
  }

  // Handle canceling edit
  const handleCancel = () => {
    if (!nodeData?.annotation_message) {
      // If this is a new annotation with no content, delete the node
      deleteElements({ nodes: [{ id }] })
      handleDelete()
    } else {
      // Restore original content
      setContent(nodeData?.annotation_message)
      setCurrentTheme(nodeData?.data?.color || "default")
      setIsEditing(false)
    }
    setShowThemePicker(false)
  }

  // Handle delete
  const handleDelete = () => {
    deleteNode(nodeData?.id ?? "", "annotationNode", strategyId)
  }

  // Handle theme change
  const handleThemeChange = (newTheme: keyof typeof themes) => {
    setCurrentTheme(newTheme)
    setShowThemePicker(false)
    handleUpdateAnnotationNode({ newTheme })
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  // Prevent node drag when interacting with controls
  const preventDrag = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
  }

  const handleUpdateAnnotationNode = ({
    newTheme,
    newContent,
  }: {
    newTheme?: keyof typeof themes
    newContent?: string
  }) => {
    const annotationData = {
      annotation_message: newContent?.trim() ?? content.trim(),
      data: { color: newTheme || currentTheme },
    }

    setIsEditing(false)
    updateNodeData(id, { ...annotationData })

    updateAnnotation(
      {
        peerId: nodeData?.id ?? "",
        strategyId,
        data: annotationData,
      },
      {
        onSuccess: (data) => {
          setNodeData(data?.data)
          setContent(annotationData.annotation_message ?? "")
          setCurrentTheme(annotationData.data.color)
        },
        onError: (error: any) => {
          showAPIErrorToast(error)
        },
      },
    )
  }

  useEffect(() => {
    if (data?.dataToAutoUpload?.data && !isAutoUploadProcessedRef.current) {
      setNodeData(data)
      setContent(data.dataToAutoUpload.data)
      isAutoUploadProcessedRef.current = true
    }
  }, [data])

  return (
    <div ref={fullscreenElementRef} className="nowheel">
      <div
        ref={nodeRef}
        className={cn(
          "relative min-h-[120px] rounded-lg border-2 shadow-sm transition-all duration-200",
          theme.bg,
          theme.border,
          selected ? "ring-2 ring-blue-500 ring-opacity-50" : "",
          "hover:shadow-md",
          document.fullscreenElement ? "w-screen h-screen" : "w-80",
        )}
        onMouseDown={preventDrag}
        onKeyDown={preventDrag}
        style={{
          width: document.fullscreenElement ? "100vw" : "380px",
          height: document.fullscreenElement ? "100vh" : "auto",
        }}
      >
        {/* Update loader */}
        {isUpdating && (
          <div
            className={cn(
              theme.bg,
              "absolute top-0 left-0 w-full h-full flex items-center justify-center bg-opacity-50 z-50 rounded-lg",
            )}
          >
            <Loader2 className={cn(theme.text, "h-10 w-10 animate-spin")} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-3 pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className={cn("h-4 w-4", theme.accent)} />
            <span className={cn("text-sm font-medium", theme.text)}>Note</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Fullscreen toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-6 w-6 p-0", theme.button)}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFullscreen()
                    }}
                  >
                    {document.fullscreenElement ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Theme picker */}
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-6 w-6 p-0", theme.button)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowThemePicker(!showThemePicker)
                      }}
                    >
                      <Palette className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Change theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {showThemePicker && (
                <div
                  className="absolute top-8 right-0 z-50 bg-white border rounded-lg shadow-lg p-2 min-w-[120px]"
                  onClick={preventDrag}
                >
                  {Object.entries(themes).map(([key, themeConfig]) => (
                    <button
                      key={key}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 flex items-center gap-2",
                        currentTheme === key ? "bg-gray-100" : "",
                      )}
                      onClick={() => handleThemeChange(key as keyof typeof themes)}
                    >
                      <div className={cn("w-3 h-3 rounded-full border", themeConfig.bg, themeConfig.border)} />
                      {themeConfig.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Edit/Save/Cancel buttons */}
            {isEditing ? (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-6 w-6 p-0 text-green-600 hover:text-green-700")}
                        onClick={handleSave}
                        disabled={isUpdating}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Save (Ctrl+Enter)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-6 w-6 p-0 text-red-600 hover:text-red-700")}
                        onClick={handleCancel}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Cancel (Esc)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-6 w-6 p-0", theme.button)}
                        onClick={() => setIsEditing(true)}
                        disabled={isUpdating}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Edit note</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-6 w-6 p-0 text-red-600 hover:text-red-700")}
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Delete note</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className={cn("px-3 pb-3", document.fullscreenElement && "flex flex-col")}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add your note here... (Ctrl+Enter to save, Esc to cancel)"
              className={cn(
                "w-full resize-none border-0 bg-transparent outline-none",
                "placeholder:text-gray-400 text-sm leading-relaxed",
                theme.text,
                document.fullscreenElement
                  ? "h-[calc(100vh-200px)] max-h-[calc(100vh-200px)] text-lg p-4 overflow-y-auto"
                  : "min-h-[60px]",
              )}
              style={{ height: document.fullscreenElement ? "auto" : "auto" }}
            />
          ) : (
            <div
              className={cn(
                "whitespace-pre-wrap break-words",
                theme.text,
                document.fullscreenElement
                  ? "h-[calc(100vh-200px)] max-h-[calc(100vh-200px)] text-lg leading-relaxed p-4 overflow-y-auto"
                  : "min-h-[60px] text-sm leading-relaxed",
              )}
            >
              {content || (
                <span onClick={() => setIsEditing(true)} className="text-gray-400 italic cursor-pointer">
                  Click to add a note...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer - Author and timestamp */}
        {!isUpdating && nodeData?.annotation_message && !document.fullscreenElement && (
          <div
            className={cn(
              "px-3 py-2 border-t flex items-center justify-between gap-4 text-xs",
              theme.border,
              theme.accent,
            )}
          >
            <div className="flex items-center gap-1 truncate">
              <User className="h-3 w-3" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate max-w-[120px] overflow-hidden whitespace-nowrap">
                      {nodeData?.edited_by ?? ""}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>{nodeData?.edited_by ?? ""}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-1 truncate">
              <Clock className="h-3 w-3" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      {nodeData?.updated_at
                        ? `Updated ${getFormattedTime(nodeData?.updated_at)}`
                        : `Created ${getFormattedTime(nodeData?.created_at ?? "")}`}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>
                      {nodeData?.updated_at
                        ? `Updated ${getFormattedTime(nodeData?.updated_at)}`
                        : `Created ${getFormattedTime(nodeData?.created_at ?? "")}`}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* Fullscreen footer */}
        {document.fullscreenElement && nodeData?.annotation_message && (
          <div
            className={cn(
              "px-6 py-4 border-t flex items-center justify-between gap-4 text-sm bg-gray-50",
              theme.border,
              theme.accent,
            )}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{nodeData?.edited_by ?? "Unknown Author"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {nodeData?.updated_at
                  ? `Updated ${getFormattedTime(nodeData?.updated_at)}`
                  : `Created ${getFormattedTime(nodeData?.created_at ?? "")}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
