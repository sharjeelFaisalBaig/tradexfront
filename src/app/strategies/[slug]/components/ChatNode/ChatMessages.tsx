import React from "react";
import { MessageSquare, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AIResponseLoader from "@/components/common/ai-response-loader";
import type { Message } from "./types";
import ChatMessage from "./ChatMessage";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  activeConversationId: string | null;
  activeConversationHasError: boolean;
  activeConversationErrorMessage: string | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement> | any;
}

const ChatMessages = React.memo(
  ({
    messages,
    isLoading,
    activeConversationId,
    activeConversationHasError,
    activeConversationErrorMessage,
    messagesEndRef,
  }: ChatMessagesProps) => {
    return (
      <div className="flex-1 flex flex-col">
        {activeConversationHasError && (
          <div className="p-4 border-b border-gray-200">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {activeConversationErrorMessage || "An error occurred"}
              </AlertDescription>
            </Alert>
          </div>
        )}
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
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
          )}
          {isLoading && (
            <div className="flex items-start gap-3 mb-6">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                🤖
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-blue-600 mb-2">
                  AI
                </div>
                <AIResponseLoader />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }
);

ChatMessages.displayName = "ChatMessages";

export default ChatMessages;
