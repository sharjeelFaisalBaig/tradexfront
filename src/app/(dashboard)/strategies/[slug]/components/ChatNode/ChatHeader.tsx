import React from "react";
import { MessageSquare } from "lucide-react";
import { AIModel } from "./types";

interface ChatHeaderProps {
  selectedModel: AIModel | null;
  activeConversationTitle: string | null;
  isLoading: boolean;
}

const ChatHeader = React.memo(
  ({ selectedModel, activeConversationTitle, isLoading }: ChatHeaderProps) => {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">AI Chat</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedModel && (
            <>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedModel.color }}
              />
              <span className="text-white text-sm">{selectedModel.name}</span>
            </>
          )}
        </div>
      </div>
    );
  }
);

ChatHeader.displayName = "ChatHeader";

export default ChatHeader;
