"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import type { Conversation, AIModel } from "./types";
import ConversationItem from "./ConversationItem";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  editingConversationId: string | null;
  editingTitle: string;
  isAnyConversationLoading: boolean;
  createConversationLoading: boolean;
  availableModels: AIModel[];
  createNewConversation: () => Promise<void>;
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

const ConversationSidebar = React.memo(
  ({
    conversations,
    activeConversationId,
    editingConversationId,
    editingTitle,
    isAnyConversationLoading,
    createConversationLoading,
    availableModels,
    createNewConversation,
    switchToConversation,
    deleteConversation,
    handleConversationTitleDoubleClick,
    handleEditingTitleKeyDown,
    handleEditingTitleBlur,
    setEditingTitle,
  }: ConversationSidebarProps) => {
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
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Conversations
        </h3>
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">
              No conversations yet
            </div>
          ) : (
            conversations
              .filter((conversation) => conversation && conversation.id)
              .map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={activeConversationId === conversation.id}
                  isEditing={editingConversationId === conversation.id}
                  editingTitle={editingTitle}
                  isAnyConversationLoading={isAnyConversationLoading}
                  availableModels={availableModels}
                  switchToConversation={switchToConversation}
                  deleteConversation={deleteConversation}
                  handleConversationTitleDoubleClick={
                    handleConversationTitleDoubleClick
                  }
                  handleEditingTitleKeyDown={handleEditingTitleKeyDown}
                  handleEditingTitleBlur={handleEditingTitleBlur}
                  setEditingTitle={setEditingTitle}
                />
              ))
          )}
        </div>
      </div>
    );
  }
);

ConversationSidebar.displayName = "ConversationSidebar";

export default ConversationSidebar;
