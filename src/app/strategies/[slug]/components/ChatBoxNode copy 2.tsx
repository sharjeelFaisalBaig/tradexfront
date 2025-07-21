"use client";
import type React from "react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
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
  Plus,
  MessageSquare,
  Copy,
  ArrowUp,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import AIResponseLoader from "@/components/common/ai-response-loader";
import NodeWrapper from "./common/NodeWrapper";
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
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [hasMorePages, setHasMorePages] = useState(false); // New state for pagination

  // Refs
  const nodeControlRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null); // Ref for the scrollable messages container
  const prevScrollHeightRef = useRef(0); // Ref to store scroll height before prepending messages
  const lastActiveConversationIdRef = useRef<string | null>(null); // Ref to track conversation changes

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
  const {
    data: activeConversationData,
    isLoading: isLoadingConversation,
    refetch: refetchConversation,
  } = useGetConversationById({
    page,
    strategyId,
    conversationId: activeConversationId ?? "",
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

  const isLoading = activeConversation?.isLoading || false; // For sending new messages
  const isLoadingOlderMessages = isLoadingConversation && page > 1; // For loading previous pages
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

  // Effect to reset page when activeConversationId changes
  useEffect(() => {
    // Only reset page if the conversation ID actually changed
    if (activeConversationId !== lastActiveConversationIdRef.current) {
      setPage(1);
      // Clear messages immediately when switching conversations to avoid showing old messages
      setMessages([]);
      setHasMorePages(false);
      lastActiveConversationIdRef.current = activeConversationId;
    }
  }, [activeConversationId]);

  // Load messages when active conversation data changes (due to page change or conversation switch)
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setHasMorePages(false);
      return;
    }

    if (activeConversationData?.conversation?.aiChats) {
      const newLoadedMessages: Message[] =
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

      setMessages((prevMessages) => {
        if (page === 1) {
          // If it's the first page for the current conversation, replace messages
          return newLoadedMessages;
        } else {
          // If loading older pages, prepend new messages
          // Store current scroll height before update to maintain scroll position
          if (messagesContainerRef.current) {
            prevScrollHeightRef.current =
              messagesContainerRef.current.scrollHeight;
          }
          const existingMessageIds = new Set(prevMessages.map((msg) => msg.id));
          const uniqueNewMessages = newLoadedMessages.filter(
            (msg) => !existingMessageIds.has(msg.id)
          );
          return [...uniqueNewMessages, ...prevMessages];
        }
      });

      // Update hasMorePages based on the latest pagination data
      if (activeConversationData.conversation.pagination) {
        setHasMorePages(
          activeConversationData.conversation.pagination.current_page <
            activeConversationData.conversation.pagination.last_page
        );
      }
    } else if (!isLoadingConversation) {
      // If no chats and not loading, clear messages (e.g., new conversation with no messages yet)
      setMessages([]);
      setHasMorePages(false);
    }
  }, [
    activeConversationData,
    activeConversationId,
    isLoadingConversation,
    parseTimestamp,
    page,
  ]);

  // Effect to adjust scroll position after prepending messages
  useEffect(() => {
    if (
      page > 1 &&
      messagesContainerRef.current &&
      prevScrollHeightRef.current > 0
    ) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDifference = newScrollHeight - prevScrollHeightRef.current;
      messagesContainerRef.current.scrollTop += scrollDifference;
      prevScrollHeightRef.current = 0; // Reset after adjustment
    }
  }, [messages, page]); // This effect runs when messages change and page > 1

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll to bottom after adding optimistic message

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
            id: `user_${Date.now()}`, // Use a new ID for the actual message
            content: userMessageText,
            sender: "user",
            timestamp,
            name: "You",
            isOptimistic: false,
          },
          {
            id: `ai_${Date.now()}`, // Use a new ID for the actual message
            content: aiMessageContent,
            sender: "ai",
            timestamp: new Date(),
            name: response.ai_model,
            isOptimistic: false,
          },
        ];
      });
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll to bottom after AI response

      // Update conversation title if it's the first message && still "New Conversation"
      if (
        messages.length === 0 && // Check if it was truly the first message in the UI
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
    messages.length, // Dependency for title update logic
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

  // New function to handle scroll to top for loading older messages
  const handleScrollToTop = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      // Check if scrolled to top, if there are more pages, and not already loading older messages
      if (scrollTop === 0 && hasMorePages && !isLoadingOlderMessages) {
        setPage((prev) => prev + 1);
        refetchConversation();
      }
    }
  }, [hasMorePages, isLoadingOlderMessages]);

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
            {/* Left Sidebar - Conversations */}
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
                    .map((conversation) => {
                      const model =
                        conversation.selectedModel ||
                        availableModels.find(
                          (m) => m.id === conversation.ai_model_id
                        );
                      const isEditing =
                        editingConversationId === conversation.id;
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
                                  onChange={(e) =>
                                    setEditingTitle(e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    handleEditingTitleKeyDown(e, conversation)
                                  }
                                  onBlur={() =>
                                    handleEditingTitleBlur(conversation)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  maxLength={60}
                                  disabled={conversation.isUpdatingTitle}
                                />
                              ) : (
                                <span
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    handleConversationTitleDoubleClick(
                                      conversation
                                    );
                                  }}
                                  title="Double click to edit"
                                  className="truncate cursor-pointer text-left flex items-center gap-2"
                                >
                                  {conversation.title ||
                                    "Untitled Conversation"}
                                  {conversation.isUpdatingTitle && (
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                  )}
                                </span>
                              )}
                              {conversation.draftMessage &&
                                conversation.draftMessage.trim() && (
                                  <span className="text-xs text-gray-500 italic truncate">
                                    Draft:{" "}
                                    {conversation.draftMessage.slice(0, 20)}...
                                  </span>
                                )}
                              {conversation.hasError && (
                                <span className="text-xs text-red-500 italic truncate">
                                  Error:{" "}
                                  {conversation.errorMessage?.slice(0, 20)}...
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
                            {conversations.length > 0 && (
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
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
            {/* Main Content Area */}
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
              <div
                className="flex-1 overflow-y-auto p-4 space-y-6"
                ref={messagesContainerRef}
                onScroll={handleScrollToTop}
              >
                {isLoadingOlderMessages && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                )}
                {!activeConversationId ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a conversation to start chatting</p>
                    </div>
                  </div>
                ) : messages.length === 0 &&
                  !isLoading &&
                  !isLoadingOlderMessages ? (
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
                              onClick={() =>
                                navigator.clipboard.writeText(msg.content)
                              }
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
                      <div className="text-sm font-semibold text-blue-600 mb-2">
                        AI
                      </div>
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
