"use client";

import type React from "react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import NodeWrapper from "../common/NodeWrapper";
import {
  useCreateConversation,
  useDeleteConversation,
  useSendChatMessage,
  useUpdateConversation,
  useUpdateConversationAiModel,
} from "@/hooks/strategy/useStrategyMutations";
import {
  useGetAiModels,
  useGetChatTemplates,
  useGetConversationById,
} from "@/hooks/strategy/useStrategyQueries";
import { getFilteredAiModels } from "@/lib/utils";
import { Loader2, MessageSquare } from "lucide-react";
import ConversationSidebar from "./ConversationSidebar";
import MainConversationSection from "./MainConversationSection";

// Import the new child components

// Types
interface AIModel {
  id: string;
  name: string;
  color: string;
}

interface Conversation {
  id: string;
  title: string;
  ai_model_id: string;
  isLoading?: boolean; // For chat message sending
  draftMessage?: string;
  selectedModel?: AIModel;
  hasError?: boolean;
  errorMessage?: string;
  isDeleting?: boolean; // New: for delete operation
  isUpdatingTitle?: boolean; // New: for title update operation
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

interface ChatBoxNodeProps {
  id: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  data?: {
    conversations?: Conversation[];
    id?: string;
  };
}

export default function ChatBoxNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: ChatBoxNodeProps) {
  console.log("ChatBoxNode_Data", { data });

  const strategyId = useParams()?.slug as string;

  // State
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const [page, setPage] = useState<number>(1);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Refs
  const nodeControlRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mutations
  const { mutateAsync: sendChatMessageMutation } = useSendChatMessage();
  const {
    mutateAsync: createConversationMutation,
    isPending: createConversationLoading,
  } = useCreateConversation();
  const { mutateAsync: updateConversationMutation } = useUpdateConversation();
  const { mutateAsync: deleteConversationMutation } = useDeleteConversation();
  const {
    mutateAsync: updateConversationAiModelMutation,
    isPending: updateModelLoading,
  } = useUpdateConversationAiModel();

  // Queries
  const { data: aiModelsData, isLoading: isLoadingModels } = useGetAiModels();
  const { data: aiTemplatesData, isLoading: isLoadingTemplates } =
    useGetChatTemplates();
  const { data: activeConversationData, isLoading: isLoadingConversation } =
    useGetConversationById({
      conversationId: activeConversationId ?? "",
      strategyId,
      page,
    });

  console.log("activeConversationData", { activeConversationData });

  // Memoized values
  const availableModels: AIModel[] = useMemo(
    () => getFilteredAiModels(aiModelsData?.models) || [],
    [aiModelsData]
  );
  const predefinedPrompts: PredefinedPrompt[] = useMemo(
    () =>
      aiTemplatesData?.templates?.map(
        (template: { text: string; title: string }) => ({
          id: template?.title,
          label: template?.title,
          prompt: template?.text,
        })
      ) || [],
    [aiTemplatesData]
  );
  const activeConversation = useMemo(
    () =>
      conversations.find((conv) => conv.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );
  const selectedModel = useMemo(
    () => activeConversation?.selectedModel || availableModels[0] || null,
    [activeConversation, availableModels]
  );

  const isAnyConversationLoading = useMemo(
    () =>
      conversations.some(
        (conv) => conv.isLoading || conv.isDeleting || conv.isUpdatingTitle
      ) ||
      createConversationLoading ||
      updateModelLoading,
    [conversations, createConversationLoading, updateModelLoading]
  );
  const isLoading = activeConversation?.isLoading || false;
  const canConnect = !isLoading; // This controls if new connections can be made to the handle

  // Helper functions
  const parseTimestamp = useCallback((val: string | undefined): Date => {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }, []);

  const generateOptimisticId = useCallback(() => {
    return `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }, []);

  // Add hydration effect
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (data?.conversations && data?.conversations?.length > 0) {
      setConversations(data?.conversations);
    }
  }, [data]);

  // Initialization useEffect: Populates conversations from props or starts empty
  useEffect(() => {
    // Only run if hydrated, models are loaded, and not yet initialized
    if (!isHydrated || isLoadingModels || isInitialized) {
      return;
    }

    const rawConversations = data?.conversations;
    const initialConversationsFromProps = Array.isArray(rawConversations)
      ? rawConversations.filter(
          (conv) => conv && typeof conv === "object" && conv.id
        )
      : [];

    if (initialConversationsFromProps.length > 0) {
      // If conversations are provided via props, use them
      const mappedConversations = initialConversationsFromProps.map((conv) => ({
        ...conv,
        selectedModel:
          availableModels.find((m) => m.id === conv.ai_model_id) ||
          availableModels[0],
        isLoading: false,
        hasError: false,
        isDeleting: false, // Initialize new state
        isUpdatingTitle: false, // Initialize new state
      }));
      setConversations(mappedConversations);
      setActiveConversationId(mappedConversations[0]?.id || null);
    } else {
      // If no conversations from props, the list starts empty.
      // A new conversation will be created when the user clicks "New Conversation".
      setConversations([]);
      setActiveConversationId(null);
    }
    setIsInitialized(true); // Mark as initialized
  }, [
    isHydrated,
    isLoadingModels,
    availableModels,
    data?.conversations,
    isInitialized,
  ]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationData?.conversation?.aiChats) {
      const loadedMessages: Message[] =
        activeConversationData.conversation.aiChats.flatMap((chat: any) => [
          {
            id: `${chat.id}_user`,
            content: chat.prompt,
            sender: "user" as const,
            name: "You",
            timestamp: parseTimestamp(chat.created_at),
            isOptimistic: false,
          },
          {
            id: `${chat.id}_ai`,
            content: chat.response,
            sender: "ai" as const,
            name: chat?.ai_model,
            timestamp: parseTimestamp(chat.updated_at),
            isOptimistic: false,
          },
        ]);
      setMessages(loadedMessages);
    } else if (activeConversationId && !isLoadingConversation) {
      setMessages([]);
    }
  }, [
    activeConversationData,
    activeConversationId,
    isLoadingConversation,
    parseTimestamp,
  ]);

  // Load draft message when switching conversations
  useEffect(() => {
    if (activeConversation?.draftMessage !== undefined) {
      setMessage(activeConversation.draftMessage);
    }
  }, [activeConversation?.draftMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Conversation management functions
  const updateConversationState = useCallback(
    (conversationId: string, updates: Partial<Conversation>) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, ...updates } : conv
        )
      );
    },
    []
  );

  const saveDraftMessage = useCallback(
    (conversationId: string, draftMessage: string) => {
      updateConversationState(conversationId, { draftMessage });
    },
    [updateConversationState]
  );

  const setConversationLoading = useCallback(
    (conversationId: string, loading: boolean) => {
      updateConversationState(conversationId, {
        isLoading: loading,
        hasError: loading ? false : undefined, // Clear error when starting new request
      });
    },
    [updateConversationState]
  );

  const setConversationError = useCallback(
    (conversationId: string, error: string) => {
      updateConversationState(conversationId, {
        hasError: true,
        errorMessage: error,
        isLoading: false, // Ensure loading is false on error
      });
    },
    [updateConversationState]
  );

  // Message handling
  const handleMessageChange = useCallback(
    (newMessage: string) => {
      setMessage(newMessage);
      if (activeConversationId) {
        saveDraftMessage(activeConversationId, newMessage);
      }
    },
    [activeConversationId, saveDraftMessage]
  );

  const removeOptimisticMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !activeConversationId || isLoading || !selectedModel)
      return;

    const userMessageText = message.trim();
    const timestamp = new Date();
    const optimisticUserId = generateOptimisticId();

    // Clear input and draft
    setMessage("");
    saveDraftMessage(activeConversationId, "");
    setConversationLoading(activeConversationId, true);

    // Add optimistic user message
    const optimisticUserMessage: Message = {
      id: optimisticUserId,
      content: userMessageText,
      sender: "user",
      name: "You",
      timestamp,
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const response = await sendChatMessageMutation({
        strategyId,
        data: {
          message: userMessageText,
          conversation_id: activeConversationId,
        },
      });

      const aiMessageContent = response?.response;
      if (!aiMessageContent) {
        throw new Error("No response received from AI");
      }

      // Remove optimistic user message and add real messages
      setMessages((prev) => {
        const withoutOptimistic = prev.filter(
          (msg) => msg.id !== optimisticUserId
        );
        return [
          ...withoutOptimistic,
          {
            id: `user_${Date.now()}`,
            content: userMessageText,
            sender: "user",
            timestamp,
            name: "You",
            isOptimistic: false,
          },
          {
            id: `ai_${Date.now()}`,
            content: aiMessageContent,
            sender: "ai",
            timestamp: new Date(),
            name: response.ai_model,
            isOptimistic: false,
          },
        ];
      });

      // Update conversation title if it's the first message && still "New Conversation"
      if (
        messages.length === 0 &&
        activeConversation?.title === "New Conversation"
      ) {
        const newTitle =
          userMessageText.slice(0, 30) +
          (userMessageText.length > 30 ? "..." : "");
        updateConversationState(activeConversationId, { title: newTitle });
        // Update title on server
        try {
          await updateConversationMutation({
            strategyId,
            conversationId: activeConversationId,
            data: { title: newTitle },
          });
        } catch (titleError) {
          console.warn("Failed to update conversation title:", titleError);
        }
      }
    } catch (error: any) {
      console.error("Send message error:", error);
      // Remove optimistic user message
      removeOptimisticMessage(optimisticUserId);
      // Set conversation error state
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send message";
      setConversationError(activeConversationId, errorMessage); // This will trigger the Alert display
      // Show error toast
      toast({
        title: "Message Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setConversationLoading(activeConversationId, false);
    }
  }, [
    message,
    activeConversationId,
    isLoading,
    selectedModel,
    generateOptimisticId,
    saveDraftMessage,
    setConversationLoading,
    messages.length,
    sendChatMessageMutation,
    strategyId,
    updateConversationState,
    updateConversationMutation,
    removeOptimisticMessage,
    setConversationError,
    activeConversation?.title,
  ]);

  const createNewConversation = useCallback(async () => {
    if (isAnyConversationLoading || !availableModels.length) return;

    try {
      const response = await createConversationMutation({
        strategyId,
        data: {
          title: "New Conversation",
          ai_thread_peer_id: data?.id ?? "",
        },
      });

      const conv = response?.conversation;
      if (!conv) throw new Error("No conversation returned from API");

      const model =
        availableModels.find((m) => m.id === conv.ai_model_id) ||
        availableModels[0];

      const newConversation: Conversation = {
        id: conv.id,
        title: conv.title,
        ai_model_id: conv.ai_model_id,
        isLoading: false,
        draftMessage: "",
        selectedModel: model,
        hasError: false,
        isDeleting: false, // Initialize new state
        isUpdatingTitle: false, // Initialize new state
      };

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === newConversation.id);
        return exists ? prev : [newConversation, ...prev];
      });
      setActiveConversationId(newConversation.id);
    } catch (error: any) {
      toast({
        title: "Failed to create conversation",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [
    isAnyConversationLoading,
    availableModels,
    createConversationMutation,
    strategyId,
    data?.id,
  ]);

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (isAnyConversationLoading) return; // Still prevent if other global operations are pending

      // Set optimistic loading state for the specific conversation
      updateConversationState(conversationId, { isDeleting: true });

      try {
        await deleteConversationMutation({ strategyId, conversationId });
        setConversations((prev) =>
          prev.filter((conv) => conv.id !== conversationId)
        );
        if (activeConversationId === conversationId) {
          const remainingConversations = conversations.filter(
            (conv) => conv.id !== conversationId
          );
          setActiveConversationId(remainingConversations[0]?.id || null);
        }
      } catch (error: any) {
        toast({
          title: "Failed to delete conversation",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        // Ensure loading state is reset even on error
        updateConversationState(conversationId, { isDeleting: false });
      }
    },
    [
      isAnyConversationLoading, // Keep this to prevent deletion if other global operations are pending
      conversations,
      deleteConversationMutation,
      strategyId,
      activeConversationId,
      updateConversationState,
    ]
  );

  const switchToConversation = useCallback(
    (conversationId: string) => {
      if (isAnyConversationLoading) return;
      setActiveConversationId(conversationId);
    },
    [isAnyConversationLoading]
  );

  const handleModelSelect = useCallback(
    async (model: AIModel) => {
      if (!activeConversationId) return;

      // Optimistically update UI
      updateConversationState(activeConversationId, { selectedModel: model });

      try {
        await updateConversationAiModelMutation({
          strategyId,
          conversationId: activeConversationId,
          data: { ai_model_id: model.id },
        });
      } catch (error: any) {
        // Revert optimistic update
        updateConversationState(activeConversationId, {
          selectedModel:
            availableModels.find(
              (m) => m.id === activeConversation?.ai_model_id
            ) || availableModels[0],
        });
        toast({
          title: "Failed to update model",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    [
      activeConversationId,
      updateConversationState,
      updateConversationAiModelMutation,
      strategyId,
      availableModels,
      activeConversation?.ai_model_id,
    ]
  );

  const handlePredefinedPromptClick = useCallback(
    (prompt: PredefinedPrompt) => {
      if (isLoading) return;
      const newMessage = message
        ? `${message}\n\n${prompt.prompt}`
        : prompt.prompt;
      setMessage(newMessage);
      if (activeConversationId) {
        saveDraftMessage(activeConversationId, newMessage);
      }
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    [isLoading, message, activeConversationId, saveDraftMessage]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Title editing functions
  const handleConversationTitleDoubleClick = useCallback(
    (conversation: Conversation) => {
      if (isAnyConversationLoading) return;
      setEditingConversationId(conversation.id);
      setEditingTitle(conversation.title);
    },
    [isAnyConversationLoading]
  );

  const saveConversationTitle = useCallback(
    async (conversation: Conversation, newTitle: string) => {
      if (conversation.title === newTitle) {
        setEditingConversationId(null);
        return;
      }

      // Optimistically update UI and set loading state for the specific conversation
      updateConversationState(conversation.id, {
        title: newTitle,
        isUpdatingTitle: true,
      });
      setEditingConversationId(null); // Hide the input immediately

      try {
        await updateConversationMutation({
          strategyId,
          conversationId: conversation.id,
          data: { title: newTitle },
        });
      } catch (error: any) {
        // Revert optimistic update and show error
        updateConversationState(conversation.id, {
          title: conversation.title,
          hasError: true,
          errorMessage:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to update title",
        });
        toast({
          title: "Failed to update title",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        updateConversationState(conversation.id, { isUpdatingTitle: false });
      }
    },
    [updateConversationState, updateConversationMutation, strategyId]
  );

  const handleEditingTitleKeyDown = useCallback(
    async (
      e: React.KeyboardEvent<HTMLInputElement>,
      conversation: Conversation
    ) => {
      if (e.key === "Enter" && editingTitle.trim()) {
        await saveConversationTitle(conversation, editingTitle.trim());
      } else if (e.key === "Escape") {
        setEditingConversationId(null);
      }
    },
    [editingTitle, saveConversationTitle]
  );

  const handleEditingTitleBlur = useCallback(
    async (conversation: Conversation) => {
      if (editingTitle.trim()) {
        await saveConversationTitle(conversation, editingTitle.trim());
      } else {
        setEditingConversationId(null);
      }
    },
    [editingTitle, saveConversationTitle]
  );

  // Show loading spinner for initial load
  if (!isHydrated || isLoadingModels || !isInitialized) {
    return (
      <NodeWrapper
        id={id}
        strategyId={strategyId}
        type="chatbox"
        className="bg-white"
      >
        <div className="w-[1100px] h-[700px] bg-white rounded-lg shadow-lg flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-500">Loading chat interface...</p>
          </div>
        </div>
      </NodeWrapper>
    );
  }

  return (
    <NodeWrapper
      id={id}
      strategyId={strategyId}
      type="chatbox"
      className="bg-white"
    >
      <div className="react-flow__node nowheel">
        <div ref={nodeControlRef} className="nodrag" />
        <div className="w-[1100px] h-[700px] bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
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
                  <span className="text-white text-sm">
                    {selectedModel.name}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex h-[calc(100%-64px)]">
            {/* Left Sidebar */}
            <ConversationSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              editingConversationId={editingConversationId}
              editingTitle={editingTitle}
              isAnyConversationLoading={isAnyConversationLoading}
              createConversationLoading={createConversationLoading}
              availableModels={availableModels}
              createNewConversation={createNewConversation}
              switchToConversation={switchToConversation}
              handleConversationTitleDoubleClick={
                handleConversationTitleDoubleClick
              }
              handleEditingTitleKeyDown={handleEditingTitleKeyDown}
              handleEditingTitleBlur={handleEditingTitleBlur}
              setEditingTitle={setEditingTitle}
              deleteConversation={deleteConversation}
            />

            {/* Main Content Area */}
            <MainConversationSection
              activeConversationId={activeConversationId}
              activeConversation={activeConversation}
              messages={messages}
              isLoading={isLoading}
              selectedModel={selectedModel}
              predefinedPrompts={predefinedPrompts}
              isLoadingTemplates={isLoadingTemplates}
              message={message}
              handleMessageChange={handleMessageChange}
              handleKeyPress={handleKeyPress}
              handleSendMessage={handleSendMessage}
              handleModelSelect={handleModelSelect}
              handlePredefinedPromptClick={handlePredefinedPromptClick}
              messagesEndRef={messagesEndRef}
              textareaRef={textareaRef}
            />
          </div>
        </div>
        <Handle
          position={targetPosition}
          type="target"
          isConnectableEnd={canConnect}
          isConnectable={canConnect}
          isConnectableStart={canConnect}
          style={{ width: "30px", height: "30px" }}
        />
      </div>
    </NodeWrapper>
  );
}
