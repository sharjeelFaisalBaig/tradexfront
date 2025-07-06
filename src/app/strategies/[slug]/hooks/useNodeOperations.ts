"use client"

import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'

// Hook for node management operations
export const useNodeOperations = () => {
  const { setNodes, setEdges } = useReactFlow()

  // Delete node and all connected edges
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nodes) => nodes.filter((node) => node.id !== nodeId))
    setEdges((edges) => edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
  }, [setNodes, setEdges])

  // Update node data
  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nodes) => 
      nodes.map((node) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    )
  }, [setNodes])

  // Update node size with minimum width constraint
  const updateNodeSize = useCallback((nodeId: string, width: number, height: number, minWidth: number = 300) => {
    const constrainedWidth = Math.max(width, minWidth)
    
    setNodes((nodes) => 
      nodes.map((node) => 
        node.id === nodeId 
          ? { 
              ...node, 
              style: { 
                ...node.style, 
                width: constrainedWidth, 
                height: height 
              },
              data: {
                ...node.data,
                nodeSize: { width: constrainedWidth, height }
              }
            }
          : node
      )
    )
  }, [setNodes])

  return { deleteNode, updateNodeData, updateNodeSize }
}
