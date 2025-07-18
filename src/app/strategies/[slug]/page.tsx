"use client"
import { useCallback, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  ReactFlowProvider,
  useStoreApi,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import "../../reactflow.css"
import { Position } from "@xyflow/react"
import ChatBoxNode from "./components/ChatBoxNode"
import { useSidebar } from "@/context/SidebarContext"
import ImageUploadNode from "./components/ImageUploadNode"
import AudioPlayerNode from "./components/AudioPlayerNode"
import StyledEdge from "./components/elements/StyledEdge"
import RemoteNode from "./components/RemoteNode"
import DocumentUploadNode from "./components/DocumentUploadNode"
import SocialMediaNode from "./components/SocialMediaNode"
import VideoUploadNode from "./components/VideoUploadNode"
import AnnotationNode from "./components/AnnotationNode"

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
}

const initialNodes = [
  {
    id: "1",
    position: { x: 1300, y: 350 },
    data: {
      label: "Chatbox",
    },
    type: "chatbox",
    ...nodeDefaults,
  },
  {
    id: "2",
    position: { x: 300, y: 350 },
    data: {
      label: "Image Upload",
    },
    type: "imageUploadNode",
    ...nodeDefaults,
  },
  {
    id: "3",
    position: { x: 300, y: 750 },
    data: {
      label: "Audio Player",
    },
    type: "audioPlayerNode",
    ...nodeDefaults,
  },
  {
    id: "4",
    position: { x: 300, y: 150 },
    data: {
      label: "Url Search",
    },
    type: "remoteNode",
    ...nodeDefaults,
  }, {
    id: "5",
    position: { x: 300, y: 950 },
    data: {
      label: "Document Upload",
    },
    type: "documentUploadNode",
    ...nodeDefaults,
  }, {
    id: "6",
    position: { x: 300, y: 1150 },
    data: {
      label: "Social Media",
    },
    type: "socialMediaNode",
    ...nodeDefaults,
  }, {
    id: "7",
    position: { x: 300, y: 1350 },
    data: {
      label: "Video Upload",
    },
    type: "videoUploadNode",
    ...nodeDefaults,
  }, {
    id: "8",
    position: { x: 700, y: 350 },
    data: {
      annotation: {
        content: "This is a sample annotation for collaborative notes!",
        author: "Demo User",
        createdAt: new Date().toISOString(),
        theme: "yellow"
      }
    },
    type: "annotationNode",
    // Note: AnnotationNode has no handles, so no sourcePosition/targetPosition
  }
]

const initialEdges: any = []

const nodeTypes = {
  chatbox: ChatBoxNode,
  imageUploadNode: ImageUploadNode,
  audioPlayerNode: AudioPlayerNode,
  remoteNode: RemoteNode,
  documentUploadNode: DocumentUploadNode,
  socialMediaNode: SocialMediaNode,
  videoUploadNode: VideoUploadNode,
  annotationNode: AnnotationNode
}

const edgeTypes = {
  styledEdge: StyledEdge,
}

const MIN_DISTANCE = 150

const Strategy = () => {
  const store = useStoreApi()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { getInternalNode, getViewport } = useReactFlow()

  // Add paste event handler for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item.type.indexOf("image") !== -1) {
          e.preventDefault()

          const file = item.getAsFile()
          if (!file) continue

          // Convert file to data URL
          const reader = new FileReader()
          reader.onload = (event) => {
            const imageData = event.target?.result as string

            // Get current viewport center
            const viewport = getViewport()
            const centerX = (-viewport.x + window.innerWidth / 2) / viewport.zoom
            const centerY = (-viewport.y + window.innerHeight / 2) / viewport.zoom

            // Create new image upload node with pasted image data
            const newNode = {
              id: `image-upload-${Date.now()}`,
              type: "imageUploadNode",
              position: { x: centerX - 500, y: centerY - 150 }, // Center the node (adjusted for 1000px width)
              data: {
                label: "Image Upload",
                pastedImage: imageData,
                pastedFileName: file.name || "pasted-image.png",
              },
              ...nodeDefaults,
            }

            // Add the new node
            setNodes((nds) => [...nds, newNode])
          }

          reader.readAsDataURL(file)
          break // Only handle the first image
        }
      }
    }

    // Add event listener to document
    document.addEventListener("paste", handlePaste)

    // Cleanup
    return () => {
      document.removeEventListener("paste", handlePaste)
    }
  }, [setNodes, getViewport])

  const onConnect = useCallback(
    (params: any) => {
      const newEdge = {
        ...params,
        type: "styledEdge",
        animated: true,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges],
  )

  const getClosestEdge = useCallback((node: any) => {
    const { nodeLookup } = store.getState()
    const internalNode: any = getInternalNode(node.id)

    const closestNode = Array.from(nodeLookup.values()).reduce(
      (res: any, n: any) => {
        if (n.id !== internalNode.id) {
          const dx = n.internals.positionAbsolute.x - internalNode.internals.positionAbsolute.x
          const dy = n.internals.positionAbsolute.y - internalNode.internals.positionAbsolute.y
          const d = Math.sqrt(dx * dx + dy * dy)

          if (d < res.distance && d < MIN_DISTANCE) {
            res.distance = d
            res.node = n
          }
        }

        return res
      },
      {
        distance: Number.MAX_VALUE,
        node: null,
      },
    )

    if (!closestNode.node) {
      return null
    }

    const closeNodeIsSource = closestNode.node.internals.positionAbsolute.x < internalNode.internals.positionAbsolute.x

    return {
      id: closeNodeIsSource ? `${closestNode.node.id}-${node.id}` : `${node.id}-${closestNode.node.id}`,
      source: closeNodeIsSource ? closestNode.node.id : node.id,
      target: closeNodeIsSource ? node.id : closestNode.node.id,
      type: "styledEdge",
      animated: true,
    }
  }, [])

  const onNodeDrag = useCallback(
    (_: any, node: any) => {
      const closeEdge: any = getClosestEdge(node)

      setEdges((es) => {
        const nextEdges = es.filter((e: any) => e.className !== "temp")

        if (
          closeEdge &&
          !nextEdges.find((ne: any) => ne.source === closeEdge.source && ne.target === closeEdge.target)
        ) {
          closeEdge.className = "temp"
          closeEdge.type = "styledEdge"
          closeEdge.animated = true
          nextEdges.push(closeEdge)
        }

        return nextEdges
      })
    },
    [getClosestEdge, setEdges],
  )

  const onNodeDragStop = useCallback(
    (_: any, node: any) => {
      const closeEdge: any = getClosestEdge(node)

      setEdges((es) => {
        const nextEdges = es.filter((e: any) => e.className !== "temp")

        if (
          closeEdge &&
          !nextEdges.find((ne: any) => ne.source === closeEdge.source && ne.target === closeEdge.target)
        ) {
          closeEdge.type = "styledEdge"
          closeEdge.animated = true
          nextEdges.push(closeEdge)
        }

        return nextEdges
      })
    },
    [getClosestEdge],
  )

  const defaultEdgeOptions = {
    type: "styledEdge",
    animated: true,
    style: {
      strokeWidth: 2,
      stroke: "#6b7280",
    },
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            defaultViewport={{ x: 0, y: 0, zoom: 0.7578582832551992 }}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
            panOnScroll={true}
            panOnScrollSpeed={0.5}
            defaultEdgeOptions={defaultEdgeOptions}
            elementsSelectable={true}
          >
            <Background />
          </ReactFlow>
        </main>
      </div>
    </div>
  )
}

export default () => (
  <ReactFlowProvider>
    <Strategy />
  </ReactFlowProvider>
)
