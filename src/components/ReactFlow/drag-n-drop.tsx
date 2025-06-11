"use client"

import { useState, useRef, type DragEvent, type ChangeEvent } from "react"
import { X, Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ImageUpload() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setUploadedImage(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    // Improved drag and drop handlers
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

        // Only set isDragOver to false if we're leaving the container, not entering a child
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

    const handleSelectFile = () => {
        fileInputRef.current?.click()
    }

    const handleRemoveImage = () => {
        setUploadedImage(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <div
            className={cn(
                "relative bg-white rounded-2xl p-12 transition-all duration-200 border-2 border-dashed",
                isDragOver ? "border-blue-400 bg-blue-50" : uploadedImage ? "border-gray-200" : "border-gray-300",
                "cursor-pointer",
            )}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!uploadedImage ? handleSelectFile : undefined}
        >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />

            {uploadedImage ? (
                // Image Preview State
                <div className="text-center">
                    <div className="relative inline-block">
                        <img
                            src={uploadedImage || "/placeholder.svg"}
                            alt="Uploaded preview"
                            className="max-w-full max-h-64 rounded-lg shadow-md"
                        />
                        <Button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveImage()
                            }}
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-gray-600 mt-4">Image uploaded successfully!</p>
                    <Button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleSelectFile()
                        }}
                        variant="outline"
                        className="mt-4"
                    >
                        Upload Different Image
                    </Button>
                </div>
            ) : (
                // Upload State
                <div className="text-center">
                    <div className="mb-6">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleSelectFile()
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-base font-medium"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Select a file
                        </Button>
                    </div>

                    <div className="text-gray-500 mb-4">
                        <span className="text-lg">or</span>
                    </div>

                    <div className="text-gray-600 text-lg">Drag and drop a file here</div>

                    <div className="text-sm text-gray-500 mt-4">Supports: JPG, PNG, GIF, WebP</div>
                </div>
            )}

            {isDragOver && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-70 rounded-2xl flex items-center justify-center z-10">
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                        <Upload className="w-12 h-12 text-blue-600 mb-2" />
                        <div className="text-blue-600 text-xl font-medium">Drop your image here</div>
                    </div>
                </div>
            )}
        </div>
    )
}
