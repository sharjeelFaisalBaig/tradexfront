import React, { useEffect, useState, useRef } from 'react';
import { Handle, NodeResizer, Position, useUpdateNodeInternals } from '@xyflow/react';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Settings, Paperclip, ChevronDown, ArrowUp, MessageSquare } from "lucide-react"
import ImageUpload from '@/components/ReactFlow/drag-n-drop';

export default function ImageUploadNode({
    id,
    sourcePosition = Position.Left,
    targetPosition = Position.Right,
    data,
}: any) {
    const nodeControlRef = useRef(null);
    return (
        <>
            <div
                className="react-flow__node"
            >
                <div ref={nodeControlRef} className={`nodrag`} />
                <ImageUpload />
                <Handle position={sourcePosition} type="source" style={{ width: '30px', height: '30px' }} />
            </div>
        </>
    );
}