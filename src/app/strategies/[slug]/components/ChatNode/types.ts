export interface AIModel {
  id: string;
  name: string;
  color: string;
}

export interface Conversation {
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

export interface PredefinedPrompt {
  id: string;
  label: string;
  prompt: string;
}

export interface Message {
  id: string;
  content: string;
  name: string;
  sender: "user" | "ai";
  timestamp: Date;
  isOptimistic?: boolean;
  hasError?: boolean;
}
