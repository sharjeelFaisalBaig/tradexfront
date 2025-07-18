"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { useReactFlow } from "@xyflow/react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import {
    X,
    Edit3,
    Save,
    Trash2,
    MessageSquare,
    User,
    Clock,
    Palette
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types for annotation data
interface AnnotationData {
    content: string
    author: string
    createdAt: string
    updatedAt?: string
    theme: 'default' | 'yellow' | 'blue' | 'green' | 'purple' | 'red'
}

interface AnnotationNodeData {
    annotation?: AnnotationData
}

interface AnnotationNodeProps {
    id: string
    data: AnnotationNodeData
    selected?: boolean
}

// Theme configurations
const themes = {
    default: {
        name: 'Default',
        bg: 'bg-white',
        border: 'border-gray-200',
        text: 'text-gray-900',
        accent: 'text-gray-600',
        button: 'text-gray-400 hover:text-gray-600'
    },
    yellow: {
        name: 'Yellow',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-900',
        accent: 'text-yellow-700',
        button: 'text-yellow-400 hover:text-yellow-600'
    },
    blue: {
        name: 'Blue',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        accent: 'text-blue-700',
        button: 'text-blue-400 hover:text-blue-600'
    },
    green: {
        name: 'Green',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        accent: 'text-green-700',
        button: 'text-green-400 hover:text-green-600'
    },
    purple: {
        name: 'Purple',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-900',
        accent: 'text-purple-700',
        button: 'text-purple-400 hover:text-purple-600'
    },
    red: {
        name: 'Red',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        accent: 'text-red-700',
        button: 'text-red-400 hover:text-red-600'
    }
}

export default function AnnotationNode({ id, data, selected }: AnnotationNodeProps) {
    const { updateNodeData, deleteElements } = useReactFlow()
    
    // State management
    const [isEditing, setIsEditing] = useState(!data.annotation?.content)
    const [content, setContent] = useState(data.annotation?.content || '')
    const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>(
        data.annotation?.theme || 'default'
    )
    const [showThemePicker, setShowThemePicker] = useState(false)
    
    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const nodeRef = useRef<HTMLDivElement>(null)
    
    // Get current theme config
    const theme = themes[currentTheme]
    
    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
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
    
    // Get current user (mock implementation - replace with actual auth)
    const getCurrentUser = () => "Current User" // Replace with actual user context
    
    // Get formatted timestamp
    const getFormattedTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    
    // Handle saving annotation
    const handleSave = () => {
        if (!content.trim()) {
            handleCancel()
            return
        }
        
        const now = new Date().toISOString()
        const annotationData: AnnotationData = {
            content: content.trim(),
            author: getCurrentUser(),
            createdAt: data.annotation?.createdAt || now,
            updatedAt: data.annotation?.createdAt ? now : undefined,
            theme: currentTheme
        }
        
        updateNodeData(id, { annotation: annotationData })
        setIsEditing(false)
    }
    
    // Handle canceling edit
    const handleCancel = () => {
        if (!data.annotation?.content) {
            // If this is a new annotation with no content, delete the node
            deleteElements({ nodes: [{ id }] })
        } else {
            // Restore original content
            setContent(data.annotation.content)
            setCurrentTheme(data.annotation.theme || 'default')
            setIsEditing(false)
        }
        setShowThemePicker(false)
    }
    
    // Handle delete
    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] })
    }
    
    // Handle theme change
    const handleThemeChange = (newTheme: keyof typeof themes) => {
        setCurrentTheme(newTheme)
        setShowThemePicker(false)
    }
    
    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            handleSave()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            handleCancel()
        }
    }
    
    // Prevent node drag when interacting with controls
    const preventDrag = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation()
    }

    
    return (
        <div
            ref={nodeRef}
            className={cn(
                "w-80 min-h-[120px] rounded-lg border-2 shadow-sm transition-all duration-200",
                theme.bg,
                theme.border,
                selected ? "ring-2 ring-blue-500 ring-opacity-50" : "",
                "hover:shadow-md"
            )}
            onMouseDown={preventDrag}
            onKeyDown={preventDrag}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 pb-2">
                <div className="flex items-center gap-2">
                    <MessageSquare className={cn("h-4 w-4", theme.accent)} />
                    <span className={cn("text-sm font-medium", theme.text)}>
                        Note
                    </span>
                </div>
                
                <div className="flex items-center gap-1">
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
                                            currentTheme === key ? "bg-gray-100" : ""
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
            <div className="px-3 pb-3">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add your note here... (Ctrl+Enter to save, Esc to cancel)"
                        className={cn(
                            "w-full min-h-[60px] resize-none border-0 bg-transparent outline-none",
                            "placeholder:text-gray-400 text-sm leading-relaxed",
                            theme.text
                        )}
                        style={{ height: 'auto' }}
                    />
                ) : (
                    <div 
                        className={cn(
                            "min-h-[60px] text-sm leading-relaxed whitespace-pre-wrap break-words",
                            theme.text
                        )}
                    >
                        {data.annotation?.content || (
                            <span className="text-gray-400 italic">Click edit to add a note...</span>
                        )}
                    </div>
                )}
            </div>
            
            {/* Footer - Author and timestamp */}
            {data.annotation && (
                <div className={cn(
                    "px-3 py-2 border-t flex items-center justify-between text-xs",
                    theme.border,
                    theme.accent
                )}>
                    <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{data.annotation.author}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                            {data.annotation.updatedAt 
                                ? `Updated ${getFormattedTime(data.annotation.updatedAt)}`
                                : `Created ${getFormattedTime(data.annotation.createdAt)}`
                            }
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
