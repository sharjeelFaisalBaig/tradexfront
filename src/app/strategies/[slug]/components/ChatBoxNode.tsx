"use client";

import type React from "react";
import { useEffect, useState, useRef, useCallback, useMemo, use } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
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
} from "lucide-react";
import AIResponseLoader from "@/components/common/ai-response-loader";
import NodeWrapper from "./common/NodeWrapper";
import { useParams } from "next/navigation";
import {
  useCreateConversation,
  useSendChatMessage,
} from "@/hooks/strategy/useStrategyMutations";
import {
  useGetAiModels,
  useGetConversationById,
  useGetConversations,
} from "@/hooks/strategy/useStrategyQueries";
import { getFilteredAiModels } from "@/lib/utils";

// Message type definition
type Message = {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
};

// Model type definition
type AIModel = {
  id: string;
  name: string;
  color: string;
  // code: string;
};

// Conversation type definition - Extended with draft message and selected model
type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isLoading?: boolean;
  draftMessage?: string; // Store unsent message for this conversation
  selectedModel?: AIModel; // Store selected model for this conversation
};

// Predefined prompt type definition
type PredefinedPrompt = {
  id: string;
  label: string;
  prompt: string;
};

export default function ChatBoxNode({
  id,
  sourcePosition = Position.Left,
  targetPosition = Position.Right,
  data,
}: any) {
  console.log("ChatBoxNode rendered with data:", data);

  const strategyId = useParams()?.slug as string;

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const { mutateAsync: sendChatMessageMutation } = useSendChatMessage();
  const { mutateAsync: createConversationMutation } = useCreateConversation();

  const { data: aiModelsData } = useGetAiModels();
  const { data: conversationsData } = useGetConversations(strategyId, {
    disabled: true,
  });
  // const { data: activeConversationData } = useGetConversationById( strategyId, activeConversationId ?? "" );
  // console.log({ activeConversationData, conversationsData });

  const nodeControlRef = useRef(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setEdges } = useReactFlow();
  const [message, setMessage] = useState("");

  const [conversations, setConversations] = useState<Conversation[]>(
    conversationsData?.conversations || []
  );

  const availableModels: AIModel[] = useMemo(
    () => getFilteredAiModels(aiModelsData?.models),
    [aiModelsData]
  );

  // Dynamic Predefined Prompts State
  const [predefinedPrompts] = useState<PredefinedPrompt[]>([
    {
      id: "summarize",
      label: "Summarize",
      prompt:
        "Please summarize the attached content, focusing on the main points and key takeaways.",
    },
    {
      id: "key-insights",
      label: "Get Key Insights",
      prompt:
        "Extract the key insights and important findings from the provided content.",
    },
    {
      id: "write-email",
      label: "Write Email",
      prompt:
        "Help me write a professional email based on the following context:",
    },
    {
      id: "explain",
      label: "Explain",
      prompt:
        "Please explain this content in simple terms that anyone can understand.",
    },
    {
      id: "action-items",
      label: "Action Items",
      prompt:
        "Identify actionable items and next steps from the provided information.",
    },
  ]);

  // Get active conversation
  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId
  );
  const messages = activeConversation?.messages || [];
  const isLoading = activeConversation?.isLoading || false;

  // Get current selected model (conversation-specific or default)
  const selectedModel = useMemo(
    () => activeConversation?.selectedModel || availableModels[0],
    [availableModels, activeConversation]
  );

  console.log({ selectedModel });

  // Check if any conversation is loading (to disable switching)
  const isAnyConversationLoading = conversations.some((conv) => conv.isLoading);

  // Determine if connection should be allowed
  const canConnect: any = true;

  // Remove connections when node becomes not connectable
  useEffect(() => {
    if (!canConnect) {
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id)
      );
    }
  }, [canConnect, id, setEdges]);

  // Create memoized functions to prevent re-renders
  const saveDraftMessage = useCallback(
    (conversationId: string, draftMessage: string) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, draftMessage, updatedAt: new Date() }
            : conv
        )
      );
    },
    []
  );

  const saveSelectedModel = useCallback(
    (conversationId: string, model: AIModel) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, selectedModel: model, updatedAt: new Date() }
            : conv
        )
      );
    },
    []
  );

  // Update the message change handler to save draft directly
  const handleMessageChange = useCallback(
    (newMessage: string) => {
      setMessage(newMessage);
      if (activeConversationId) {
        saveDraftMessage(activeConversationId, newMessage);
      }
    },
    [activeConversationId, saveDraftMessage]
  );

  const createNewConversation = useCallback(async () => {
    if (isAnyConversationLoading) return;

    try {
      // Call mutation to create conversation on backend (only title and description allowed)
      const response = await createConversationMutation({
        strategyId,
        data: {
          title: "New Conversation",
          ai_thread_peer_id: data?.id,
        },
      });

      // Use only response.conversation for newConversation
      const conv = response?.conversation;
      if (!conv) throw new Error("No conversation returned from API");

      // Find the model by ai_model_id
      const model =
        availableModels.find((m) => m.id === conv.ai_model_id) ||
        availableModels[0];

      const newConversation: Conversation = {
        id: conv.id,
        title: conv.title,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isLoading: false,
        draftMessage: "",
        selectedModel: model,
      };

      setConversations((prev) => {
        // Check if conversation already exists to prevent duplicates
        const exists = prev.some((conv) => conv.id === newConversation.id);
        if (exists) return prev;
        return [newConversation, ...prev];
      });
      setActiveConversationId(newConversation.id);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  }, [
    isAnyConversationLoading,
    availableModels,
    createConversationMutation,
    strategyId,
  ]);

  // Delete conversation
  const deleteConversation = useCallback(
    (conversationId: string) => {
      if (isAnyConversationLoading) return;

      // Find the conversation to delete
      const conversationToDelete = conversations.find(
        (conv) => conv.id === conversationId
      );
      const conversationIndex = conversations.findIndex(
        (conv) => conv.id === conversationId
      );

      // Prevent deletion of the first conversation
      if (conversationIndex === 0) {
        console.log("Cannot delete the first conversation");
        return;
      }

      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );

      // If deleted conversation was active, switch to first available
      if (activeConversationId === conversationId) {
        const remainingConversations = conversations.filter(
          (conv) => conv.id !== conversationId
        );
        if (remainingConversations.length > 0) {
          setActiveConversationId(remainingConversations[0].id);
        }
      }
    },
    [isAnyConversationLoading, activeConversationId, conversations]
  );

  // Initialize with first conversation - fix to prevent multiple calls
  useEffect(() => {
    if (conversations.length === 0) {
      const initialConversation: Conversation = {
        id: `conv_${Date.now()}_initial`,
        title: "New Conversation",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isLoading: false,
        draftMessage: "",
        selectedModel: availableModels[0],
      };

      setConversations([initialConversation]);
      setActiveConversationId(initialConversation.id);
    }
  }, []); // Empty dependency array - only run once

  // Scroll to bottom when messages change
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

  // Load conversation-specific draft message and model when switching conversations
  useEffect(() => {
    if (activeConversation) {
      // Only update if the message is different to prevent loops
      const draftMessage = activeConversation.draftMessage || "";
      if (message !== draftMessage) {
        setMessage(draftMessage);
      }
    }
  }, [activeConversationId]); // Remove activeConversation and message from dependencies

  // Switch to conversation
  const switchToConversation = (conversationId: string) => {
    if (isAnyConversationLoading) return;
    setActiveConversationId(conversationId);
  };

  // Update conversation title based on first user message
  const updateConversationTitle = (
    conversationId: string,
    firstMessage: string
  ) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              title:
                firstMessage.slice(0, 30) +
                (firstMessage.length > 30 ? "..." : ""),
              updatedAt: new Date(),
            }
          : conv
      )
    );
  };

  // Add message to specific conversation
  const addMessageToConversation = (
    conversationId: string,
    newMessage: Message
  ) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              updatedAt: new Date(),
            }
          : conv
      )
    );
  };

  // Set loading state for specific conversation
  const setConversationLoading = (conversationId: string, loading: boolean) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, isLoading: loading } : conv
      )
    );
  };

  // Handle predefined prompt click
  const handlePredefinedPromptClick = (prompt: PredefinedPrompt) => {
    if (isLoading) return;

    const newMessage = message
      ? `${message}\n\n${prompt.prompt}`
      : prompt.prompt;
    setMessage(newMessage);

    // Focus textarea after adding prompt
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // Handle model selection - Save to current conversation
  const handleModelSelect = (model: AIModel) => {
    if (activeConversationId) {
      saveSelectedModel(activeConversationId, model);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversationId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    // Add user message to active conversation
    addMessageToConversation(activeConversationId, userMessage);

    // Update conversation title if it's the first message
    const currentConversation = conversations.find(
      (conv) => conv.id === activeConversationId
    );
    if (currentConversation && currentConversation.messages.length === 0) {
      updateConversationTitle(activeConversationId, message.trim());
    }

    const currentConversationId = activeConversationId;
    const currentSelectedModel = selectedModel;

    // Clear message and draft
    setMessage("");
    saveDraftMessage(currentConversationId, "");
    setConversationLoading(currentConversationId, true);

    console.log({
      createChatPayload: {
        strategyId: strategyId,
        conversationId: currentConversationId,
        data: {
          message: userMessage.content,
          // strategy_collaborator_id: "", // empty for now (optional)
        },
      },
    });

    try {
      // Use sendChatMessageMutation with required arguments
      const response = await sendChatMessageMutation({
        strategyId: strategyId,
        conversationId: currentConversationId,
        data: {
          message: userMessage.content,
          // strategy_collaborator_id: "", // empty for now (optional)
        },
      });

      // Assume response contains the AI message content
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          (response && response.message) ||
          `<div class="ai-response-container">
            <p>Response from <strong>${currentSelectedModel?.name}</strong>:</p>
            <p>I understand your message: "<strong>${userMessage.content}</strong>"</p>
            <p>This is a placeholder response. In production, this would be replaced with actual AI processing using the selected model.</p>
          </div>`,
        sender: "ai",
        timestamp: new Date(),
      };

      addMessageToConversation(currentConversationId, aiMessage);
      setConversationLoading(currentConversationId, false);
    } catch (error) {
      console.error("Error sending message:", error);
      setConversationLoading(currentConversationId, false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <NodeWrapper
        id={id}
        strategyId={strategyId}
        type="chatbox"
        className="bg-white"
      >
        <div className="react-flow__node nowheel">
          <div ref={nodeControlRef} className={`nodrag`} />

          <div className="w-[1100px] h-[700px] bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">AI Chat</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedModel?.color }}
                />
                <span className="text-white text-sm">
                  {selectedModel?.name}
                </span>
              </div>
            </div>

            <div className="flex h-[calc(100%-64px)]">
              {/* Left Sidebar - Conversations */}
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
                                    Draft:{" "}
                                    {conversation.draftMessage.slice(0, 20)}...
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
                                  backgroundColor:
                                    conversation.selectedModel?.color,
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

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col">
                {/* Content Header */}
                <div className="p-6 border-b border-gray-200 text-left">
                  <h1 className="text-xl font-semibold text-gray-800">
                    {activeConversation?.title || "New Conversation"}
                    {isLoading && (
                      <span className="ml-2 text-sm text-blue-500 font-normal">
                        AI is thinking...
                      </span>
                    )}
                  </h1>
                  {/* Show current model for active conversation */}
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedModel?.color }}
                    />
                    <span className="text-sm text-gray-500">
                      Using {selectedModel?.name}
                    </span>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {messages.length === 0 ? (
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
                          className="flex items-start gap-3 mb-4 text-left"
                        >
                          <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            U
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-green-600 mb-1">
                              You
                            </div>
                            <div className="text-gray-800 text-sm whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={msg.id}
                          className="flex items-start gap-3 mb-6"
                        >
                          <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs">
                            🤖
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-semibold text-blue-600 mb-2">
                              AI
                            </div>
                            <div
                              className="ai-message-content text-gray-700 text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: msg.content }}
                            />
                            <div className="flex items-center gap-4 mt-3">
                              <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600">
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
                      <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs">
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
                          style={{
                            paddingRight: "8px",
                            scrollbarWidth: "thin",
                            scrollbarColor: "#9CA3AF #F3F4F6",
                          }}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1 text-xs h-7"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: selectedModel?.color }}
                          />
                          {selectedModel?.name}
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
                              {selectedModel?.id === model?.id && (
                                <span className="ml-auto">✓</span>
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Predefined Prompts */}
                    {predefinedPrompts.map((prompt) => (
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
                    ))}
                  </div>
                </div>
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
    </>
  );
}
