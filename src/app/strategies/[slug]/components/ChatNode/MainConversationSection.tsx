"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Copy,
  ArrowUp,
  AlertCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import AIResponseLoader from "@/components/common/ai-response-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";

// Re-define types or import them from a shared types file if you have one
interface AIModel {
  id: string;
  name: string;
  color: string;
}

interface Conversation {
  id: string;
  title: string;
  ai_model_id: string;
  isLoading?: boolean;
  draftMessage?: string;
  selectedModel?: AIModel;
  hasError?: boolean;
  errorMessage?: string;
  isDeleting?: boolean;
  isUpdatingTitle?: boolean;
}

interface PredefinedPrompt {
  id: string;
  label: string;
  prompt: string;
}

interface Message {
  id: string;
  content: string;
  name: string;
  sender: "user" | "ai";
  timestamp: Date;
  isOptimistic?: boolean;
  hasError?: boolean;
}

interface MainChatSectionProps {
  availableModels?: AIModel[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  selectedModel: AIModel | null;
  predefinedPrompts: PredefinedPrompt[];
  isLoadingTemplates: boolean;
  message: string;
  handleMessageChange: (msg: string) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleSendMessage: () => Promise<void>;
  handleModelSelect: (model: AIModel) => Promise<void>;
  handlePredefinedPromptClick: (prompt: PredefinedPrompt) => void;
  messagesEndRef: React.RefObject<HTMLDivElement> | any;
  textareaRef: React.RefObject<HTMLTextAreaElement> | any;
}

export default function MainConversationSection({
  availableModels,
  activeConversationId,
  activeConversation,
  messages,
  isLoading,
  selectedModel,
  predefinedPrompts,
  isLoadingTemplates,
  message,
  handleMessageChange,
  handleKeyPress,
  handleSendMessage,
  handleModelSelect,
  handlePredefinedPromptClick,
  messagesEndRef,
  textareaRef,
}: MainChatSectionProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Content Header */}
      <div className="p-6 border-b border-gray-200 text-left">
        <h1 className="text-xl font-semibold text-gray-800">
          {activeConversation?.title || "Select a conversation"}
          {isLoading && (
            <span className="ml-2 text-sm text-blue-500 font-normal">
              AI is thinking...
            </span>
          )}
        </h1>
        {selectedModel && (
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedModel.color }}
            />
            <span className="text-sm text-gray-500">
              Using {selectedModel.name}
            </span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {activeConversation?.hasError && (
        <div className="p-4 border-b border-gray-200">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {activeConversation.errorMessage || "An error occurred"}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!activeConversationId ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation by typing a message below</p>
            </div>
          </div>
        ) : (
          messages.map((msg) =>
            msg.sender === "user" ? (
              <div
                key={msg.id}
                className={`flex items-start gap-3 mb-4 text-left ${
                  msg.isOptimistic ? "opacity-70" : ""
                }`}
                style={{ justifySelf: "end" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-right text-sm font-semibold text-green-600 mb-1">
                    {msg.name}
                  </div>
                  <div className="text-gray-800 text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>
                <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  U
                </div>
              </div>
            ) : (
              <div
                key={msg.id}
                className={`flex items-start gap-3 mb-6 ${
                  msg.isOptimistic ? "opacity-70" : ""
                }`}
              >
                <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-semibold text-blue-600 mb-2">
                    {msg.name}
                  </div>
                  <div className="ai-message-content text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )
          )
        )}
        {isLoading && (
          <div className="flex items-start gap-3 mb-6">
            <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
              🤖
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-blue-600 mb-2">AI</div>
              <AIResponseLoader />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      {activeConversationId && (
        <div className="border-t border-gray-200 p-4">
          {/* Input Field */}
          <div className="relative mb-3">
            <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="relative pr-12 p-2">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask anything..."
                  className="w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm resize-none min-h-[20px] max-h-[120px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500"
                  disabled={isLoading}
                  rows={1}
                />
              </div>
              <Button
                size="sm"
                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8 p-0 flex-shrink-0 z-10"
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {/* Model Selector */}
            {selectedModel && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs h-7"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedModel.color }}
                    />
                    {selectedModel.name}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableModels?.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => handleModelSelect(model)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: model.color }}
                        />
                        {model.name}
                        {selectedModel.id === model.id && (
                          <span className="ml-auto">✓</span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Predefined Prompts */}
            {isLoadingTemplates ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
            ) : (
              predefinedPrompts?.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  onClick={() => handlePredefinedPromptClick(prompt)}
                  disabled={isLoading}
                >
                  {prompt.label}
                </Button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
