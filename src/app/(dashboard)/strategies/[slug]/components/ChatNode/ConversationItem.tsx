"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import type { Conversation, AIModel } from "./types";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  isAnyConversationLoading: boolean;
  availableModels: AIModel[];
  switchToConversation: (id: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  handleConversationTitleDoubleClick: (conv: Conversation) => void;
  handleEditingTitleKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    conv: Conversation
  ) => void;
  handleEditingTitleBlur: (conv: Conversation) => void;
  setEditingTitle: (title: string) => void;
}

const ConversationItem = React.memo(
  ({
    conversation,
    isActive,
    isEditing,
    editingTitle,
    isAnyConversationLoading,
    availableModels,
    switchToConversation,
    deleteConversation,
    handleConversationTitleDoubleClick,
    handleEditingTitleKeyDown,
    handleEditingTitleBlur,
    setEditingTitle,
  }: ConversationItemProps) => {
    const model =
      conversation.selectedModel ||
      availableModels.find((m) => m.id === conversation.ai_model_id);

    return (
      <div
        key={conversation.id}
        className={`group flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors ${
          isActive
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
          <div className="flex flex-col min-w-0 flex-1">
            {isEditing ? (
              <input
                type="text"
                className="text-sm font-medium rounded px-1 py-0.5 border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-blue-700 w-full"
                value={editingTitle}
                autoFocus
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => handleEditingTitleKeyDown(e, conversation)}
                onBlur={() => handleEditingTitleBlur(conversation)}
                onClick={(e) => e.stopPropagation()}
                maxLength={60}
                disabled={conversation.isUpdatingTitle}
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleConversationTitleDoubleClick(conversation);
                }}
                title="Double click to edit"
                className="truncate cursor-pointer text-left flex items-center gap-2"
              >
                {conversation.title || "Untitled Conversation"}
                {conversation.isUpdatingTitle && (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                )}
              </span>
            )}
            {conversation.draftMessage && conversation.draftMessage.trim() && (
              <span className="text-xs text-gray-500 italic truncate">
                Draft: {conversation.draftMessage.slice(0, 20)}
                {"..."}
              </span>
            )}
            {conversation.hasError && (
              <span className="text-xs text-red-500 italic truncate">
                Error: {conversation.errorMessage?.slice(0, 20)}
                {"..."}
              </span>
            )}
          </div>
          {conversation.isLoading && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {model && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: model.color }}
            />
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={isAnyConversationLoading}
            className={`h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 ${
              conversation.isDeleting
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } disabled:opacity-50`}
            onClick={(e) => {
              e.stopPropagation();
              deleteConversation(conversation.id);
            }}
          >
            {conversation.isDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>
    );
  }
);

ConversationItem.displayName = "ConversationItem";

export default ConversationItem;
