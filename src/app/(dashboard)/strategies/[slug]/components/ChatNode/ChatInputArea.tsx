"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ArrowUp, Loader2 } from "lucide-react";
import type { AIModel, PredefinedPrompt } from "./types";

interface ChatInputAreaProps {
  message: string;
  isLoading: boolean;
  activeConversationId: string | null;
  selectedModel: AIModel | null;
  availableModels: AIModel[];
  predefinedPrompts: PredefinedPrompt[];
  isLoadingTemplates: boolean;
  handleMessageChange: (msg: string) => void;
  handleSendMessage: () => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleModelSelect: (model: AIModel) => Promise<void>;
  handlePredefinedPromptClick: (prompt: PredefinedPrompt) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement> | any;
}

const ChatInputArea = React.memo(
  ({
    message,
    isLoading,
    activeConversationId,
    selectedModel,
    availableModels,
    predefinedPrompts,
    isLoadingTemplates,
    handleMessageChange,
    handleSendMessage,
    handleKeyPress,
    handleModelSelect,
    handlePredefinedPromptClick,
    textareaRef,
  }: ChatInputAreaProps) => {
    if (!activeConversationId) return null;

    return (
      <div className="border-t border-gray-200 p-4">
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
        <div className="flex items-center gap-2 text-xs flex-wrap">
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
                {availableModels.map((model) => (
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
    );
  }
);

ChatInputArea.displayName = "ChatInputArea";

export default ChatInputArea;
