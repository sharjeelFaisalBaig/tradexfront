"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Handle, Position, useReactFlow } from "@xyflow/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Package, Edit3, Check, X, Maximize2, Minimize2, FolderOpen, Users, Move } from "lucide-react"
import { cn } from "@/lib/utils"

interface GroupContainerNodeProps {
  id: string
  data: {
    label?: string
    width?: number
    height?: number
    containedNodes?: string[]
    isExpanded?: boolean
  }
  selected?: boolean
}

export default function GroupContainerNode({ id, data, selected = false }: GroupContainerNodeProps) {
  const { getNodes, setNodes, getNode, updateNodeData } = useReactFlow()

  // State
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(data.label || "Group Container")
  const [tempTitle, setTempTitle] = useState(title)
  const [dimensions, setDimensions] = useState({
    width: data.width || 800,
    height: data.height || 600,
  })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(data.isExpanded !== false)
  const [containedNodes, setContainedNodes] = useState<string[]>(data.containedNodes || [])
  const [isDragging, setIsDragging] = useState(false)
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const resizeStartPos = useRef({ x: 0, y: 0 })
  const resizeStartDimensions = useRef({ width: 0, height: 0 })

  // Get current node position
  const currentNode = getNode(id)
  const nodePosition = currentNode?.position || { x: 0, y: 0 }

  // Track position changes to move contained nodes
  useEffect(() => {
    if (isDragging && currentNode) {
      const deltaX = currentNode.position.x - lastPosition.x
      const deltaY = currentNode.position.y - lastPosition.y

      if (deltaX !== 0 || deltaY !== 0) {
        // Move all contained nodes by the same delta
        setNodes((nodes) =>
          nodes.map((node) => {
            if (containedNodes.includes(node.id)) {
              return {
                ...node,
                position: {
                  x: node.position.x + deltaX,
                  y: node.position.y + deltaY,
                },
              }
            }
            return node
          }),
        )
      }

      setLastPosition(currentNode.position)
    }
  }, [isDragging, containedNodes, setNodes])

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    if (currentNode) {
      setLastPosition(currentNode.position)
    }
  }, [currentNode])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add event listeners for drag events
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("mousedown", handleDragStart)
    document.addEventListener("mouseup", handleDragEnd)

    return () => {
      container.removeEventListener("mousedown", handleDragStart)
      document.removeEventListener("mouseup", handleDragEnd)
    }
  }, [handleDragStart, handleDragEnd])

  // Check if a point is inside the container
  const isPointInContainer = useCallback(
    (x: number, y: number) => {
      const containerBounds = {
        left: nodePosition.x,
        right: nodePosition.x + dimensions.width,
        top: nodePosition.y,
        bottom: nodePosition.y + dimensions.height,
      }

      return (
        x >= containerBounds.left &&
        x <= containerBounds.right &&
        y >= containerBounds.top &&
        y <= containerBounds.bottom
      )
    },
    [nodePosition, dimensions],
  )

  // Update contained nodes based on position
  const updateContainedNodes = useCallback(() => {
    const allNodes = getNodes()
    const newContainedNodes: string[] = []

    allNodes.forEach((node) => {
      if (node.id === id) return // Skip self

      const nodeCenter = {
        x: node.position.x + (node.width || 200) / 2,
        y: node.position.y + (node.height || 100) / 2,
      }

      if (isPointInContainer(nodeCenter.x, nodeCenter.y)) {
        newContainedNodes.push(node.id)
      }
    })

    if (JSON.stringify(newContainedNodes) !== JSON.stringify(containedNodes)) {
      setContainedNodes(newContainedNodes)
      updateNodeData(id, { containedNodes: newContainedNodes })
    }
  }, [getNodes, id, isPointInContainer, containedNodes, updateNodeData])

  // Handle title editing
  const handleTitleEdit = () => {
    setIsEditing(true)
    setTempTitle(title)
    setTimeout(() => titleInputRef.current?.focus(), 0)
  }

  const handleTitleSave = () => {
    setTitle(tempTitle)
    setIsEditing(false)
    updateNodeData(id, { label: tempTitle })
  }

  const handleTitleCancel = () => {
    setTempTitle(title)
    setIsEditing(false)
  }

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave()
    } else if (e.key === "Escape") {
      handleTitleCancel()
    }
  }

  // Handle expand/collapse
  const toggleExpanded = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    updateNodeData(id, { isExpanded: newExpanded })
  }

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)
    setResizeHandle(handle)
    resizeStartPos.current = { x: e.clientX, y: e.clientY }
    resizeStartDimensions.current = { ...dimensions }

    document.addEventListener("mousemove", handleResizeMove)
    document.addEventListener("mouseup", handleResizeEnd)
  }

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeHandle) return

      const deltaX = e.clientX - resizeStartPos.current.x
      const deltaY = e.clientY - resizeStartPos.current.y

      let newWidth = resizeStartDimensions.current.width
      let newHeight = resizeStartDimensions.current.height

      if (resizeHandle.includes("right")) {
        newWidth = Math.max(400, resizeStartDimensions.current.width + deltaX)
      }
      if (resizeHandle.includes("left")) {
        newWidth = Math.max(400, resizeStartDimensions.current.width - deltaX)
      }
      if (resizeHandle.includes("bottom")) {
        newHeight = Math.max(300, resizeStartDimensions.current.height + deltaY)
      }
      if (resizeHandle.includes("top")) {
        newHeight = Math.max(300, resizeStartDimensions.current.height - deltaY)
      }

      setDimensions({ width: newWidth, height: newHeight })
    },
    [isResizing, resizeHandle],
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeHandle(null)
    updateNodeData(id, { width: dimensions.width, height: dimensions.height })

    document.removeEventListener("mousemove", handleResizeMove)
    document.removeEventListener("mouseup", handleResizeEnd)

    // Update contained nodes after resize
    setTimeout(updateContainedNodes, 100)
  }, [dimensions, id, updateNodeData, handleResizeMove, updateContainedNodes])

  // Update contained nodes when nodes move
  useEffect(() => {
    const interval = setInterval(updateContainedNodes, 500)
    return () => clearInterval(interval)
  }, [updateContainedNodes])

  // Cleanup resize listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeMove)
      document.removeEventListener("mouseup", handleResizeEnd)
    }
  }, [handleResizeMove, handleResizeEnd])

  const containerStyle = {
    width: dimensions.width,
    height: isExpanded ? dimensions.height : 60,
    minWidth: 400,
    minHeight: isExpanded ? 300 : 60,
  }

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className={cn(
          "relative bg-white rounded-xl border-2 transition-all duration-200 shadow-lg",
          selected ? "border-indigo-500 shadow-indigo-200" : "border-gray-200 hover:border-gray-300",
          isResizing && "select-none",
          isDragging && "cursor-move",
        )}
        style={containerStyle}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-xl cursor-move",
            !isExpanded && "rounded-xl",
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  ref={titleInputRef}
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={handleTitleKeyPress}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70 text-sm h-8 backdrop-blur-sm"
                  placeholder="Enter group name..."
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTitleSave}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTitleCancel}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 group">
                <h3 className="font-semibold text-lg truncate">{title}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTitleEdit}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Node count indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  <Users className="w-4 h-4" />
                  <span>{containedNodes.length}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{containedNodes.length} nodes in this group</p>
              </TooltipContent>
            </Tooltip>

            {/* Expand/Collapse button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleExpanded}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Move indicator */}
            <div className="cursor-move p-1 opacity-70">
              <Move className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Container Body */}
        {isExpanded && (
          <div className="relative flex-1 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Drop zone indicator */}
            <div className="absolute inset-6 border-2 border-dashed border-indigo-300 rounded-xl flex items-center justify-center text-indigo-600 bg-white/50 backdrop-blur-sm">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-semibold mb-2">Drop nodes here to group them</p>
                <p className="text-sm text-indigo-500">
                  {containedNodes.length > 0
                    ? `${containedNodes.length} node${containedNodes.length === 1 ? "" : "s"} grouped`
                    : "Drag any node into this container to organize your workflow"}
                </p>
              </div>
            </div>

            {/* Contained nodes info */}
            {containedNodes.length > 0 && (
              <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-indigo-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium text-indigo-800">Grouped Nodes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {containedNodes.map((nodeId) => {
                    const node = getNode(nodeId)
                    const nodeLabel = node?.data?.label || node?.type || nodeId.slice(0, 8)
                    return (
                      <span
                        key={nodeId}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                      >
                        {nodeLabel}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resize handles */}
        {isExpanded && selected && (
          <>
            {/* Corner handles */}
            <div
              className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-500 rounded-full cursor-se-resize hover:bg-indigo-600 transition-colors border-2 border-white shadow-lg"
              onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
            />
            <div
              className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-500 rounded-full cursor-ne-resize hover:bg-indigo-600 transition-colors border-2 border-white shadow-lg"
              onMouseDown={(e) => handleResizeStart(e, "top-right")}
            />
            <div
              className="absolute -bottom-2 -left-2 w-5 h-5 bg-indigo-500 rounded-full cursor-sw-resize hover:bg-indigo-600 transition-colors border-2 border-white shadow-lg"
              onMouseDown={(e) => handleResizeStart(e, "bottom-left")}
            />
            <div
              className="absolute -top-2 -left-2 w-5 h-5 bg-indigo-500 rounded-full cursor-nw-resize hover:bg-indigo-600 transition-colors border-2 border-white shadow-lg"
              onMouseDown={(e) => handleResizeStart(e, "top-left")}
            />

            {/* Edge handles */}
            <div
              className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-10 bg-indigo-500 rounded-full cursor-e-resize hover:bg-indigo-600 transition-colors shadow-md"
              onMouseDown={(e) => handleResizeStart(e, "right")}
            />
            <div
              className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-10 bg-indigo-500 rounded-full cursor-w-resize hover:bg-indigo-600 transition-colors shadow-md"
              onMouseDown={(e) => handleResizeStart(e, "left")}
            />
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-indigo-500 rounded-full cursor-s-resize hover:bg-indigo-600 transition-colors shadow-md"
              onMouseDown={(e) => handleResizeStart(e, "bottom")}
            />
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-indigo-500 rounded-full cursor-n-resize hover:bg-indigo-600 transition-colors shadow-md"
              onMouseDown={(e) => handleResizeStart(e, "top")}
            />
          </>
        )}

        {/* Connection handles */}
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: "14px",
            height: "14px",
            background: "#6366f1",
            border: "3px solid white",
            left: "-7px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: "14px",
            height: "14px",
            background: "#6366f1",
            border: "3px solid white",
            right: "-7px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />
      </div>
    </TooltipProvider>
  )
}
