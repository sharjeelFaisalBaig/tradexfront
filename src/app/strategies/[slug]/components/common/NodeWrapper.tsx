"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNodeOperations } from '../../hooks/useNodeOperations'

interface NodeWrapperProps {
  id: string
  children: React.ReactNode
  className?: string
  showDeleteButton?: boolean
  onDelete?: () => void
}

export default function NodeWrapper({
  id,
  children,
  className = "",
  showDeleteButton = true,
  onDelete
}: NodeWrapperProps) {
  const { deleteNode } = useNodeOperations()
  const [isHovered, setIsHovered] = useState(false)

  // Handle delete
  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    } else {
      deleteNode(id)
    }
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "relative bg-white rounded-lg shadow-sm border transition-all duration-200",
          isHovered && "shadow-md ring-2 ring-blue-200",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onWheel={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Delete Button */}
        {showDeleteButton && isHovered && (
          <div className="absolute top-2 right-2 z-50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleDelete}
                  size="icon"
                  variant="destructive"
                  className="h-6 w-6 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <X className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Delete node</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Content */}
        <div className="w-full h-full">
          {children}
        </div>
      </div>
    </TooltipProvider>
  )
}
