"use client";

import React from "react";
import { Copy } from "lucide-react";
import type { Message } from "./types";
import { MemoizedMarkdown } from "./memoized-markdown";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = React.memo(({ message }: ChatMessageProps) => {
  if (message.sender === "user") {
    return (
      <div
        key={message.id}
        className={`flex items-start gap-3 mb-4 text-left ${
          message.isOptimistic ? "opacity-70" : ""
        }`}
        style={{ justifySelf: "end" }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-right text-sm font-semibold text-green-600 mb-1">
            {message.name}
          </div>
          <div className="text-gray-800 text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          U
        </div>
      </div>
    );
  } else {
    return (
      <div
        key={message.id}
        className={`flex items-start gap-3 mb-6 ${
          message.isOptimistic ? "opacity-70" : ""
        }`}
      >
        <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
          🤖
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-semibold text-blue-600 mb-2">
            {message.name}
          </div>
          <div className="ai-message-content text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
            <MemoizedMarkdown id={message.id} content={message.content} />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <button
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
              onClick={() => navigator.clipboard.writeText(message.content)}
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
        </div>
      </div>
    );
  }
});

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
