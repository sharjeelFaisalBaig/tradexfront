import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import React from "react";

export interface Conversation {
  id: string;
  title: string;
  draftMessage?: string;
  isLoading?: boolean;
  selectedModel?: {
    color: string;
    [key: string]: any;
  };
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isAnyConversationLoading: boolean;
  createNewConversation: () => void;
  switchToConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  isAnyConversationLoading,
  createNewConversation,
  switchToConversation,
  deleteConversation,
}) => {
  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 p-4">
      <Button
        onClick={createNewConversation}
        disabled={isAnyConversationLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Conversation
      </Button>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Conversations
        </h3>
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors ${
                  activeConversationId === conversation.id
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                } ${
                  isAnyConversationLoading
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                onClick={() => switchToConversation(conversation.id)}
              >
                <div className="flex-1 truncate flex items-center gap-2">
                  <div className="flex flex-col">
                    <span>{conversation.title}</span>
                    {/* Show draft indicator if conversation has unsent message */}
                    {conversation.draftMessage &&
                      conversation.draftMessage.trim() && (
                        <span className="text-xs text-gray-500 italic">
                          Draft: {conversation.draftMessage.slice(0, 20)}...
                        </span>
                      )}
                  </div>
                  {conversation.isLoading && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {/* Show model indicator for each conversation */}
                  {conversation.selectedModel && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: conversation.selectedModel?.color,
                      }}
                    />
                  )}

                  {/* Only show delete button if this is not the first conversation */}
                  {conversations.length > 1 &&
                    conversations.indexOf(conversation) !== 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isAnyConversationLoading}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationSidebar;
