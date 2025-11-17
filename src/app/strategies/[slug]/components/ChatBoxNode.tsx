"use client";
import type React from "react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { NodeResizer, Position, useReactFlow } from "@xyflow/react";
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
  Maximize,
  Minimize,
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
import { getFilteredAiModels, preventNodeDeletionKeys } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NodeHandle from "./common/NodeHandle";
import { useCredits } from "@/context/CreditContext";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

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
  isLoading?: boolean;
  draftMessage?: string;
  selectedModel?: AIModel;
  hasError?: boolean;
  errorMessage?: string;
  isDeleting?: boolean;
  isUpdatingTitle?: boolean;
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
  const successNote = useSuccessNotifier();
  const strategyId = useParams()?.slug as string;
  const { updateCredits } = useCredits();
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
  const [dimensions, setDimensions] = useState({ width: 1100, height: 700 });

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const nodeControlRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenElementRef = useRef<HTMLDivElement>(null);

  const { setNodes } = useReactFlow();

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

  const { data: aiModelsData, isLoading: isLoadingModels } = useGetAiModels();
  const { data: aiTemplatesData, isLoading: isLoadingTemplates } =
    useGetChatTemplates();

  const {
    data: conversationMessagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: isLoadingMoreMessages,
    isLoading: isLoadingConversationMessages,
  } = useConversationMessages({
    strategyId,
    conversationId: activeConversationId ?? "",
  });

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

  const allFetchedMessages = useMemo(
    () =>
      conversationMessagesData?.pages
        ?.flatMap((page) => page.aiChats)
        .reverse() ?? [],
    [conversationMessagesData]
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

  const parseTimestamp = useCallback((val: string | undefined): Date => {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }, []);

  const generateOptimisticId = useCallback(
    () => `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    []
  );

  useEffect(() => {
    if (isLoadingModels || isInitialized) return;
    const rawConversations = data?.conversations;
    const initialConversationsFromProps = Array.isArray(rawConversations)
      ? rawConversations.filter(
          (conv) => conv && typeof conv === "object" && conv?.id
        )
      : [rawConversations];

    if (initialConversationsFromProps.length > 0) {
      const mappedConversations = initialConversationsFromProps.map(
        (conv: any) => ({
          ...conv,
          selectedModel:
            availableModels.find((m) => m.id === conv?.ai_model_id) ||
            availableModels[0],
          isLoading: false,
          hasError: false,
          isDeleting: false,
          isUpdatingTitle: false,
        })
      );
      setConversations(mappedConversations);
      setActiveConversationId(mappedConversations[0]?.id || null);
    } else {
      setConversations([]);
      setActiveConversationId(null);
    }
    setIsInitialized(true);
  }, [isLoadingModels, availableModels, data, isInitialized]);

  useEffect(() => {
    if (activeConversationId) {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    const mappedFetchedMessages: Message[] = allFetchedMessages
      .slice()
      .flatMap((chat: any) => [
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
      const existingFetchedIds = new Set(
        mappedFetchedMessages.map((msg) => msg.id)
      );
      const currentOptimisticMessages = prevMessages
        ?.reverse()
        ?.filter((msg) => msg.isOptimistic && !existingFetchedIds.has(msg.id));
      const combined = [
        ...mappedFetchedMessages,
        ...currentOptimisticMessages,
      ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

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

  useEffect(() => {
    if (!isLoadingConversationMessages) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeConversationId, isLoadingConversationMessages]);

  useEffect(() => {
    if (!isLoadingMoreMessages) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.isOptimistic) {
        const timer = setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, isLoadingMoreMessages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

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

  const handleSendMessage = useCallback(
    async (prompt?: string) => {
      if (!activeConversationId || isLoading || !selectedModel) return;
      const userMessageText = prompt?.trim() || message.trim();
      if (!userMessageText) return;
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
        updateCredits({ usedCredits: response?.credits });

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
            // Failed to update conversation title silently
          }
        }
      } catch (error: any) {
        // Handle message send error
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
    },
    [
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
      updateCredits,
    ]
  );

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
        availableModels.find((m) => m.id === conv?.ai_model_id) ||
        availableModels[0];
      const newConversation: Conversation = {
        id: conv.id,
        title: conv.title,
        ai_model_id: conv?.ai_model_id,
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
      const newMessage = prompt.prompt;
      setMessage(newMessage);
      if (activeConversationId) {
        saveDraftMessage(activeConversationId, newMessage);
      }
      handleSendMessage(newMessage);
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    [isLoading, activeConversationId, saveDraftMessage, handleSendMessage]
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

  const handleMessagesScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = event.currentTarget;
      if (
        scrollTop === 0 &&
        hasNextPage &&
        !isLoadingMoreMessages &&
        activeConversationId
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isLoadingMoreMessages, activeConversationId, fetchNextPage]
  );

  const handleCopyResponse = (text: string) => {
    navigator.clipboard.writeText(text);
    successNote({
      description: "Copied to clipboard",
      className: "h-10",
    });
  };

  const toggleFullscreen = () => {
    const element = fullscreenElementRef.current;
    const chatBox = chatBoxRef.current;
    if (!element) {
      return; // Element not found
    }
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => {
            if (chatBox) {
              chatBox.style.width = "1100px";
              chatBox.style.height = "700px";
              chatBox.style.borderRadius = "0.5rem";
              chatBox.style.boxShadow =
                "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
            }
          })
          .catch((err) => {
            // Failed to exit fullscreen mode
          });
      }
    } else {
      if (element.requestFullscreen) {
        element
          .requestFullscreen()
          .then(() => {
            if (chatBox) {
              chatBox.style.width = "100vw";
              chatBox.style.height = "100vh";
              chatBox.style.borderRadius = "0";
              chatBox.style.boxShadow = "none";
            }
          })
          .catch((err) => {
            // Failed to enable fullscreen mode
          });
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const chatBox = chatBoxRef.current;
        if (chatBox) {
          setDimensions({ width: 1100, height: 700 });
          chatBox.style.width = "1100px";
          chatBox.style.height = "700px";
          chatBox.style.borderRadius = "0.5rem";
          chatBox.style.boxShadow =
            "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const onResize = (
    event: any,
    { width, height }: { width: any; height: any }
  ) => {
    setDimensions({ width, height });
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          node.style = { ...node.style, width, height };
        }
        return node;
      })
    );
  };

  return (
    <NodeWrapper
      id={id}
      strategyId={strategyId}
      type="chatbox"
      className="bg-white"
    >
      <div
        className="nowheel"
        ref={fullscreenElementRef}
        onKeyDown={preventNodeDeletionKeys}
        // className="react-flow__node nowheel"
      >
        <NodeResizer
          nodeId={data?.id}
          color="#2563eb"
          minWidth={1100}
          minHeight={700}
          onResize={onResize}
        />
        <div
          ref={nodeControlRef}
          className="nodrag"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
        <div
          ref={chatBoxRef}
          className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
        >
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
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {document.fullscreenElement ? (
                  <Minimize className="text-white" />
                ) : (
                  <Maximize className="text-white" />
                )}
              </Button>
            </div>
          </div>
          {/* Main Content Area */}
          <div className="flex h-[calc(100%-64px)] nodrag">
            {/* Left Sidebar - Conversations */}
            <div className="w-72 bg-gray-50 border-r border-gray-200 p-4 flex-shrink-0 nodrag">
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
            <div className="flex-1 flex flex-col nodrag">
              {/* Content Header */}
              <div className="p-6 border-b border-gray-200 text-left nodrag">
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
                <div className="p-4 border-b border-gray-200 nodrag">
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
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 nodrag"
                onScroll={handleMessagesScroll}
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
                    {isLoadingMoreMessages && (
                      <div className="flex justify-center py-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    )}
                    {messages.map((msg) =>
                      msg.sender === "user" ? (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 mb-4 ${
                            msg.isOptimistic ? "opacity-70" : ""
                          }`}
                        >
                          <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            U
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="text-sm font-semibold text-green-600 mb-1">
                              {msg.name}
                            </div>
                            <div className="text-gray-800 text-sm whitespace-pre-wrap break-words select-text">
                              {msg.content}
                            </div>
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
                <div className="border-t border-gray-200 p-4 nodrag">
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
                          className="text-gray-800 w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm resize-none min-h-[20px] max-h-[120px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500"
                          disabled={
                            isLoadingConversationMessages ||
                            isAnyConversationLoading ||
                            isLoadingModels ||
                            !isInitialized ||
                            isLoading
                          }
                          rows={1}
                        />
                      </div>
                      <Button
                        size="sm"
                        className="absolute bottom-2 right-2 text-white bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8 p-0 flex-shrink-0 z-10"
                        onClick={() => handleSendMessage()}
                        disabled={
                          isLoading ||
                          !message.trim() ||
                          isLoadingConversationMessages
                        }
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
                            disabled={
                              isLoading ||
                              isAnyConversationLoading ||
                              isLoadingConversationMessages
                            }
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs h-7 text-black"
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
                          className="text-xs h-7 bg-blue-50 !text-blue-600 border-blue-200 hover:bg-blue-100"
                          onClick={() => handlePredefinedPromptClick(prompt)}
                          disabled={
                            isLoading ||
                            isAnyConversationLoading ||
                            isLoadingConversationMessages
                          }
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
