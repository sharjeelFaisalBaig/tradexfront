"use client";

import type React from "react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Position } from "@xyflow/react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
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
import { toast } from "@/hooks/use-toast";

import type { AIModel, Conversation, Message, PredefinedPrompt } from "./types";
import ChatHeader from "./ChatHeader";
import ConversationSidebar from "./ConversationSidebar";
import ChatMessages from "./ChatMessages";
import ChatInputArea from "./ChatInputArea";
import NodeWrapper from "../common/NodeWrapper";
import NodeHandle from "../common/NodeHandle";

interface ChatBoxNodeProps {
  id: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  data?: {
    conversations?: Conversation[];
    id?: string;
  };
}

export default function ChatNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: ChatBoxNodeProps) {
  const strategyId = useParams()?.slug as string;

  // State
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [page, setPage] = useState<number>(1); // Not used in current implementation, but kept for potential future pagination
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
      strategyId,
      conversationId: activeConversationId ?? "",
      page,
    });

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
  const canConnect = !isLoading;

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

  // Initialization useEffect: Populates conversations from props or starts empty
  useEffect(() => {
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
      const mappedConversations = initialConversationsFromProps.map((conv) => ({
        ...conv,
        selectedModel:
          availableModels.find((m) => m.id === conv.ai_model_id) ||
          availableModels[0],
        isLoading: false,
        hasError: false,
        isDeleting: false,
        isUpdatingTitle: false,
      }));
      setConversations(mappedConversations);
      setActiveConversationId(mappedConversations[0]?.id || null);
    } else {
      setConversations([]);
      setActiveConversationId(null);
    }
    setIsInitialized(true);
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
        hasError: loading ? false : undefined,
      });
    },
    [updateConversationState]
  );

  const setConversationError = useCallback(
    (conversationId: string, error: string) => {
      updateConversationState(conversationId, {
        hasError: true,
        errorMessage: error,
        isLoading: false,
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

    setMessage("");
    saveDraftMessage(activeConversationId, "");
    setConversationLoading(activeConversationId, true);

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

      if (
        messages.length === 0 &&
        activeConversation?.title === "New Conversation"
      ) {
        const newTitle =
          userMessageText.slice(0, 30) +
          (userMessageText.length > 30 ? "..." : "");
        updateConversationState(activeConversationId, { title: newTitle });
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
      removeOptimisticMessage(optimisticUserId);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send message";
      setConversationError(activeConversationId, errorMessage);
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
        isDeleting: false,
        isUpdatingTitle: false,
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
      if (isAnyConversationLoading) return;
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
        updateConversationState(conversationId, { isDeleting: false });
      }
    },
    [
      isAnyConversationLoading,
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
      updateConversationState(activeConversationId, { selectedModel: model });
      try {
        await updateConversationAiModelMutation({
          strategyId,
          conversationId: activeConversationId,
          data: { ai_model_id: model.id },
        });
      } catch (error: any) {
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
      updateConversationState(conversation.id, {
        title: newTitle,
        isUpdatingTitle: true,
      });
      setEditingConversationId(null);
      try {
        await updateConversationMutation({
          strategyId,
          conversationId: conversation.id,
          data: { title: newTitle },
        });
      } catch (error: any) {
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
          <ChatHeader
            selectedModel={selectedModel}
            activeConversationTitle={activeConversation?.title || null}
            isLoading={isLoading}
          />
          <div className="flex h-[calc(100%-64px)]">
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
              deleteConversation={deleteConversation}
              handleConversationTitleDoubleClick={
                handleConversationTitleDoubleClick
              }
              handleEditingTitleKeyDown={handleEditingTitleKeyDown}
              handleEditingTitleBlur={handleEditingTitleBlur}
              setEditingTitle={setEditingTitle}
            />
            <div className="flex-1 flex flex-col">
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
              <ChatMessages
                messages={messages}
                isLoading={isLoading}
                activeConversationId={activeConversationId}
                activeConversationHasError={
                  activeConversation?.hasError || false
                }
                activeConversationErrorMessage={
                  activeConversation?.errorMessage
                }
                messagesEndRef={messagesEndRef}
              />
              <ChatInputArea
                message={message}
                isLoading={isLoading}
                activeConversationId={activeConversationId}
                selectedModel={selectedModel}
                availableModels={availableModels}
                predefinedPrompts={predefinedPrompts}
                isLoadingTemplates={isLoadingTemplates}
                handleMessageChange={handleMessageChange}
                handleSendMessage={handleSendMessage}
                handleKeyPress={handleKeyPress}
                handleModelSelect={handleModelSelect}
                handlePredefinedPromptClick={handlePredefinedPromptClick}
                textareaRef={textareaRef}
              />
            </div>
          </div>
        </div>

        <NodeHandle
          type="target"
          canConnect={canConnect}
          position={targetPosition}
        />
      </div>
    </NodeWrapper>
  );
}
