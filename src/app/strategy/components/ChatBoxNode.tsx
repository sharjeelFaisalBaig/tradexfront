"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Handle, Position } from "@xyflow/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, ArrowUp } from "lucide-react"
import AIResponseLoader from "@/components/common/ai-response-loader"

// Message type definition
type Message = {
    id: string
    content: string
    sender: "user" | "ai"
    timestamp: Date
}

// Sample AI responses
const aiResponses: any = [
    // "Based on the stock data you've shared, the strongest performers right now appear to be NVIDIA, Amazon, and Alphabet with high EPS growth (81.60%, 72.20%, and 37.53% respectively), signaling strong profitability momentum. NVIDIA also leads in volume and market interest, likely due to AI-sector hype. Microsoft remains a stable giant with a solid 3.5T market cap and steady growth, making it a dependable tech holding. Tesla shows the highest price gain today (+3.67%) but has the weakest EPS growth (-53.53%), which may raise long-term sustainability concerns despite short-term momentum. Broadcom is the only stock in red today (-5.00%), possibly due to overvaluation or earnings pressure, even though its P/E ratio (92.78) is significantly higher than others, indicating high investor expectations. Meta shows strong fundamentals with a high EPS and solid growth, backed by a good analyst rating. Overall, the market leans bullish on most top-tier tech and growth stocks, with Broadcom and Tesla warranting deeper review for risk.",
    // "Among all the stocks shown, Microsoft Corporation (MSFT) stands out as the top performer overall due to its massive $3.5 trillion market cap, solid EPS of 12.94 USD with a healthy 12.13% year-over-year growth, a reasonable P/E ratio of 36.35, and a “Strong Buy” analyst rating, all while offering a 0.69% dividend yield, making it a balanced giant in both growth and income. While NVIDIA shows exceptional EPS growth at 81.60% and strong investor momentum, Microsoft leads in overall financial strength, stability, and long-term value, making it the most dominant pick on this list."
]

export default function ChatBoxNode({
    id,
    sourcePosition = Position.Left,
    targetPosition = Position.Right,
    data,
}: any) {
    const nodeControlRef = useRef(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentResponseIndex, setCurrentResponseIndex] = useState(0)

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Format date as "7 June 2025 ~ 2:34 PM"
    const formatDate = (date: Date) => {
        return `${date.getDate()} ${date.toLocaleString("default", {
            month: "long",
        })} ${date.getFullYear()} ~ ${date.toLocaleString("default", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })}`
    }

    // Handle sending a message
    const handleSendMessage = () => {
        if (!message.trim()) return

        // Add user message
        const newUserMessage: Message = {
            id: Date.now().toString(),
            content: message,
            sender: "user",
            timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newUserMessage])
        setMessage("")

        // Show loading indicator
        setIsLoading(true)

        // Simulate AI response after 3 seconds
        setTimeout(() => {
            const response = aiResponses[currentResponseIndex]
            setCurrentResponseIndex((prev) => (prev + 1) % aiResponses.length)
            const newAIMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: response,
                sender: "ai",
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, newAIMessage])
            setIsLoading(false)
        }, 3000)
    }

    // Handle Enter key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <>
            <div className="react-flow__node">
                <div ref={nodeControlRef} className={`nodrag`} />
                <div className="flex h-screen bg-gray-50 w-[1000px]">
                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-center">
                            <h1 className="text-base font-medium text-gray-800">New Conversation</h1>
                        </div>

                        {/* Chat Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {messages.map((msg) =>
                                msg.sender === "user" ? (
                                    // User Message
                                    <div key={msg.id} className="flex justify-end">
                                        <div className="max-w-2xl">
                                            <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 text-left">
                                                <p className="text-base">{msg.content}</p>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 text-right">{formatDate(msg.timestamp)}</div>
                                        </div>
                                    </div>
                                ) : (
                                    // AI Response
                                    <div key={msg.id} className="flex justify-start">
                                        <div className="max-w-2xl text-base">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                                    AI
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-left bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                                                        <p className="text-gray-800 leading-relaxed">{msg.content}</p>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 text-left">{formatDate(msg.timestamp)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}

                            {/* Loading indicator */}
                            {isLoading && <AIResponseLoader />}

                            {/* Invisible div for scrolling to bottom */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-white border-t border-gray-200 p-4 px-1">
                            <div className="mx-auto">
                                {/* Input Field */}
                                <div className="relative mb-3">
                                    <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200">
                                        <Input
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            placeholder="Type your message to GPT-4o here..."
                                            className="flex-1 placeholder:text-base text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                        />
                                        <Button
                                            size="lg"
                                            className="m-1 bg-blue-600 hover:bg-blue-700 rounded-full w-10 h-10 p-0"
                                            onClick={handleSendMessage}
                                            disabled={isLoading || !message.trim()}
                                        >
                                            <ArrowUp className="!w-6 !h-6" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="flex items-center gap-2 text-base">
                                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                                GPT-4o
                                                <ChevronDown className="w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>
                                                <div className="flex items-center gap-2 text-base">
                                                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                                    GPT-4o
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-base bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                                    >
                                        Summarize
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-base bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                                    >
                                        Get Key Insights
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-base bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                                    >
                                        Write Email
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Handle position={targetPosition} type="target" style={{ width: "30px", height: "30px" }} />
            </div>
        </>
    )
}
