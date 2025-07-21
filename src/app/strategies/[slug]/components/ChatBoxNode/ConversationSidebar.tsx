"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2 } from "lucide-react";

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

interface LeftSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  editingConversationId: string | null;
  editingTitle: string;
  isAnyConversationLoading: boolean;
  createConversationLoading: boolean;
  availableModels: AIModel[];
  createNewConversation: () => Promise<void>;
  switchToConversation: (id: string) => void;
  handleConversationTitleDoubleClick: (conv: Conversation) => void;
  handleEditingTitleKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    conv: Conversation
  ) => Promise<void>;
  handleEditingTitleBlur: (conv: Conversation) => Promise<void>;
  setEditingTitle: (title: string) => void;
  deleteConversation: (id: string) => Promise<void>;
}

export default function ConversationSidebar({
  conversations,
  activeConversationId,
  editingConversationId,
  editingTitle,
  isAnyConversationLoading,
  createConversationLoading,
  availableModels,
  createNewConversation,
  switchToConversation,
  handleConversationTitleDoubleClick,
  handleEditingTitleKeyDown,
  handleEditingTitleBlur,
  setEditingTitle,
  deleteConversation,
}: LeftSidebarProps) {
  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 p-4 flex-shrink-0">
      <Button
        onClick={createNewConversation}
        disabled={createConversationLoading || isAnyConversationLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {createConversationLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        New Conversation
      </Button>
      <h3 className="text-sm font-medium text-gray-500 mb-3">Conversations</h3>
      <div className="space-y-2">
        {conversations.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">
            No conversations yet
          </div>
        ) : (
          conversations
            .filter((conversation) => conversation && conversation.id) // Add safety filter
            .map((conversation) => {
              const model =
                conversation.selectedModel ||
                availableModels.find((m) => m.id === conversation.ai_model_id);
              const isEditing = editingConversationId === conversation.id;
              const isActive = activeConversationId === conversation.id;
              return (
                <div
                  key={conversation.id}
                  className={`group flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100 text-gray-700"
                  } ${
                    isAnyConversationLoading // This now correctly includes per-item loading
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                  onClick={() => switchToConversation(conversation.id)}
                >
                  <div className="flex-1 truncate flex items-center gap-2">
                    <div className="flex flex-col min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          className="text-sm font-medium rounded px-1 py-0.5 border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-blue-700 w-full"
                          value={editingTitle}
                          autoFocus
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) =>
                            handleEditingTitleKeyDown(e, conversation)
                          }
                          onBlur={() => handleEditingTitleBlur(conversation)}
                          onClick={(e) => e.stopPropagation()}
                          maxLength={60}
                          disabled={conversation.isUpdatingTitle} // Disable input while saving
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleConversationTitleDoubleClick(conversation);
                          }}
                          title="Double click to edit"
                          className="truncate cursor-pointer text-left flex items-center gap-2" // Added flex for loader
                        >
                          {conversation.title || "Untitled Conversation"}
                          {/* MODIFIED: Show loader for title update */}
                          {conversation.isUpdatingTitle && (
                            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                          )}
                        </span>
                      )}
                      {/* Show draft indicator */}
                      {conversation.draftMessage &&
                        conversation.draftMessage.trim() && (
                          <span className="text-xs text-gray-500 italic truncate">
                            Draft: {conversation.draftMessage.slice(0, 20)}...
                          </span>
                        )}
                      {/* Show error indicator */}
                      {conversation.hasError && (
                        <span className="text-xs text-red-500 italic truncate">
                          Error: {conversation.errorMessage?.slice(0, 20)}...
                        </span>
                      )}
                    </div>
                    {conversation.isLoading && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Model indicator */}
                    {model && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: model.color }}
                      />
                    )}
                    {/* Delete button */}
                    {conversations.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isAnyConversationLoading} // Disabled if any global operation is pending
                        className={`h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 ${
                          conversation.isDeleting
                            ? "opacity-100" // Always show loader when deleting
                            : "opacity-0 group-hover:opacity-100" // Hide normally, show on hover
                        } disabled:opacity-50`} // General disabled opacity
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                      >
                        {/* MODIFIED: Show loader for delete operation */}
                        {conversation.isDeleting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
