"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, HelpCircle, Loader2 } from "lucide-react";
import { useRef } from "react";

// Predefined color classes for Tailwind to generate at build time
const colorClasses: Record<string, { input: string; button: string }> = {
  purple: {
    input: "focus:border-purple-500 focus:ring-purple-500",
    button: "bg-purple-500 hover:bg-purple-600",
  },
  blue: {
    input: "focus:border-blue-500 focus:ring-blue-500",
    button: "bg-blue-500 hover:bg-blue-600",
  },
  cyan: {
    input: "focus:border-cyan-500 focus:ring-cyan-500",
    button: "bg-cyan-500 hover:bg-cyan-600",
  },
  red: {
    input: "focus:border-red-500 focus:ring-red-500",
    button: "bg-red-500 hover:bg-red-600",
  },
  green: {
    input: "focus:border-green-500 focus:ring-green-500",
    button: "bg-green-500 hover:bg-green-600",
  },
};

interface AiNoteInputProps {
  color?: "purple" | "blue" | "red" | "green" | "cyan"; // restrict to valid colors
  note?: string;
  setNote: (value?: string) => void;
  onButtonClick?: () => void;
  isLoading?: boolean;
  isInputDisabled?: boolean;
  isButtonDisabled?: boolean;
  hideButton?: boolean;
  readOnly?: boolean;
}

const AiNoteInput = (props: AiNoteInputProps) => {
  const {
    color = "purple",
    note,
    setNote,
    onButtonClick,
    isLoading,
    isInputDisabled,
    isButtonDisabled,
    hideButton,
    readOnly,
  } = props;

  const selectedColor = colorClasses[color] || colorClasses.purple;

  const inputRef = useRef<HTMLInputElement | any>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (hideButton || readOnly || isLoading) return;

    if (e.key === "Enter") {
      e.preventDefault();
      onButtonClick?.();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 flex items-center gap-2">
        <Input
          ref={inputRef}
          readOnly={readOnly}
          placeholder="Add notes for AI to use..."
          value={note}
          onChange={(e) => setNote(e?.target?.value)}
          className={`pr-8 border-gray-200 ${selectedColor.input} ${
            readOnly || isLoading ? "cursor-not-allowed" : ""
          }`}
          disabled={isInputDisabled}
          onKeyDown={handleKeyPress}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              Add notes that will be used by AI to provide better context and
              insights
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      {hideButton || readOnly ? (
        <></>
      ) : (
        <Button
          size="sm"
          type="button"
          onClick={() => onButtonClick?.()}
          disabled={isButtonDisabled}
          className={`${selectedColor.button} text-white rounded-full w-8 h-8 p-0 disabled:opacity-50`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
};

export default AiNoteInput;
