"use client";
import type React from "react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Position } from "@xyflow/react";
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
  useConversationMessages,
  useGetAiModels,
  useGetChatTemplates,
} from "@/hooks/strategy/useStrategyQueries";
import { getFilteredAiModels } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NodeHandle from "./common/NodeHandle";
import { useCredits } from "@/context/CreditContext";

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
  const { updateCredits } = useCredits();

  // State
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const nodeControlRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null); // New ref for the scrollable messages area

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

  // NEW: use useConversationMessages for fetching messages
  const {
    data: conversationMessagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: isLoadingMoreMessages, // Renamed for clarity
    isLoading: isLoadingConversationMessages, // Renamed for clarity
  } = useConversationMessages({
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

  // NEW: Flatten all messages from the infinite query data
  const allFetchedMessages = useMemo(() => {
    return (
      conversationMessagesData?.pages
        ?.reverse()
        ?.flatMap((page) => page.aiChats) ?? []
    );
  }, [conversationMessagesData]);

  const activeConversation = useMemo(
    () =>
      conversations.find((conv) => conv.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );
  const selectedModel = useMemo(
    () => activeConversation?.selectedModel || availableModels[0] || null,
    [activeConversation, availableModels]
  );

  // MODIFIED: isAnyConversationLoading now checks per-item loading states
  const isAnyConversationLoading = useMemo(
    () =>
      conversations.some(
        (conv) => conv.isLoading || conv.isDeleting || conv.isUpdatingTitle
      ) ||
      createConversationLoading ||
      updateModelLoading,
    [conversations, createConversationLoading, updateModelLoading]
  );

  const isLoading = activeConversation?.isLoading || false; // This specifically refers to sending/receiving the current message
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

  // Initialization useEffect: Populates conversations from props or starts empty
  useEffect(() => {
    // Only run if hydrated, models are loaded, and not yet initialized
    if (isLoadingModels || isInitialized) {
      return;
    }

    const rawConversations = data?.conversations;
    const initialConversationsFromProps = Array.isArray(rawConversations)
      ? rawConversations.filter(
          (conv) => conv && typeof conv === "object" && conv?.id
        )
      : [rawConversations];

    if (initialConversationsFromProps.length > 0) {
      // If conversations are provided via props, use them
      const mappedConversations = initialConversationsFromProps.map((conv) => ({
        ...conv,
        selectedModel:
          // @ts-ignore
          availableModels.find((m) => m.id === conv.ai_model_id) ||
          availableModels[0],
        isLoading: false,
        hasError: false,
        isDeleting: false, // Initialize new state
        isUpdatingTitle: false, // Initialize new state
      }));
      // @ts-ignore
      setConversations(mappedConversations);
      setActiveConversationId(mappedConversations[0]?.id || null);
    } else {
      // If no conversations from props, the list starts empty.
      // A new conversation will be created when the user clicks "New Conversation".
      setConversations([]);
      setActiveConversationId(null);
    }
    setIsInitialized(true); // Mark as initialized
  }, [isLoadingModels, availableModels, data, isInitialized]);

  // When active conversation changes, reset messages to trigger a fresh load from useConversationMessages
  useEffect(() => {
    if (activeConversationId) {
      setMessages([]); // Clear messages to load new conversation from scratch
      // The useConversationMessages hook will automatically refetch for the new conversationId
    }
  }, [activeConversationId]);

  // NEW: Load messages when allFetchedMessages changes (including pagination)
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]); // Clear messages if no active conversation
      return;
    }

    const mappedFetchedMessages: Message[] = allFetchedMessages.flatMap(
      (chat: any) => [
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
      ]
    );

    setMessages((prevMessages) => {
      // Filter out optimistic messages that have been replaced by fetched messages
      const existingFetchedIds = new Set(
        mappedFetchedMessages.map((msg) => msg.id)
      );

      const currentOptimisticMessages = prevMessages
        ?.reverse()
        .filter((msg) => msg.isOptimistic && !existingFetchedIds.has(msg.id));

      // Combine fetched messages with remaining optimistic messages and sort by timestamp
      const combined = [
        ...mappedFetchedMessages,
        ...currentOptimisticMessages,
      ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Adjust scroll position if loading older messages (scrolled to top)
      if (isLoadingMoreMessages && messagesContainerRef.current) {
        const oldScrollHeight = messagesContainerRef.current.scrollHeight;
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop =
              newScrollHeight - oldScrollHeight;
          }
        });
      }
      return combined;
    });
  }, [
    allFetchedMessages,
    activeConversationId,
    parseTimestamp,
    isLoadingMoreMessages,
  ]);

  // Auto-scroll to bottom when new messages are added (not during pagination)
  useEffect(() => {
    // Only scroll if not currently fetching older messages AND the last message is not an optimistic one
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100); // Small delay to ensure render
    return () => clearTimeout(timer);
  }, [activeConversationId]); // Depend on messages array and pagination state

  useEffect(() => {
    // Only scroll if not currently fetching older messages AND the last message is not an optimistic one
    if (!isLoadingMoreMessages) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.isOptimistic) {
        const timer = setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100); // Small delay to ensure render
        return () => clearTimeout(timer);
      }
    }
  }, [messages, isLoadingMoreMessages]); // Depend on messages array and pagination state

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

      // update credits
      updateCredits({ usedCredits: response?.credits });

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
    messages.length, // Keep this dependency for title update logic
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

  // MODIFIED: deleteConversation to use per-item loading
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

  // MODIFIED: saveConversationTitle to use per-item loading
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

  // New scroll handler for pagination
  const handleMessagesScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = event.currentTarget;
      // Check if scrolled to the very top and not already fetching
      if (
        scrollTop === 0 &&
        hasNextPage &&
        !isLoadingMoreMessages &&
        activeConversationId
      ) {
        fetchNextPage(); // Load older messages
      }
    },
    [hasNextPage, isLoadingMoreMessages, activeConversationId, fetchNextPage]
  );

  const handleCopyResponse = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Copied to clipboard",
      className: "h-10",
    });
  };

  if (
    isLoadingModels ||
    !isInitialized ||
    (activeConversationId && isLoadingConversationMessages)
  ) {
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
                    .filter((conversation) => conversation && conversation.id) // Add safety filter
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
                                  disabled={conversation.isUpdatingTitle} // Disable input while saving
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
                                  className="truncate cursor-pointer text-left flex items-center gap-2" // Added flex for loader
                                >
                                  {conversation.title ||
                                    "Untitled Conversation"}
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
                                    Draft:{" "}
                                    {conversation.draftMessage.slice(0, 20)}...
                                  </span>
                                )}
                              {/* Show error indicator */}
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
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {/* Content Header */}
              <div className="p-6 border-b border-gray-200 text-left">
                <h1 className="text-xl font-semibold text-gray-800">
                  {activeConversation?.title || "Select a conversation"}
                  {isLoading && (
                    <span className="ml-2 text-sm text-blue-500 font-normal">
                      {selectedModel?.name} is thinking...
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
                ref={messagesContainerRef} // Assign the new ref here
                className="flex-1 overflow-y-auto p-4 space-y-6"
                onScroll={handleMessagesScroll} // Add scroll handler
              >
                {!activeConversationId ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a conversation to start chatting</p>
                    </div>
                  </div>
                ) : messages.length === 0 &&
                  isLoadingConversationMessages &&
                  !isLoadingMoreMessages ? (
                  // New: Loader for initial conversation history load
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
                      <p className="text-gray-500">
                        Loading conversation history...
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 && !isLoadingMoreMessages ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation by typing a message below</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Loader for pagination at the top of messages */}
                    {isLoadingMoreMessages && (
                      <div className="flex justify-center py-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    )}
                    {messages.map((msg) =>
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
                                onClick={() => handleCopyResponse(msg.content)}
                              >
                                <Copy className="w-3 h-3" />
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </>
                )}
                {/* AI thinking loader (only if not fetching older messages) */}
                {isLoading && !isLoadingMoreMessages && (
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                      🤖
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-blue-600 mb-2">
                        {selectedModel?.name}
                      </div>
                      <AIResponseLoader modelName={selectedModel?.name} />
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
                            disabled={isLoading}
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

        <NodeHandle
          type="target"
          canConnect={canConnect}
          position={targetPosition}
        />
      </div>
    </NodeWrapper>
  );
}
