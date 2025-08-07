"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useSendPeerAiNote } from "@/hooks/strategy/useStrategyMutations";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { useDebounce } from "@/hooks/useDebounce";
import { cn, showAPIErrorToast } from "@/lib/utils";

const colorClasses = {
  purple: { input: "focus:border-purple-500 focus:ring-purple-500" },
  blue: { input: "focus:border-blue-500 focus:ring-blue-500" },
  cyan: { input: "focus:border-cyan-500 focus:ring-cyan-500" },
  red: { input: "focus:border-red-500 focus:ring-red-500" },
  green: { input: "focus:border-green-500 focus:ring-green-500" },
};

interface AiNoteInputProps {
  color?: "purple" | "blue" | "red" | "green" | "cyan";
  note?: string;
  setNote: (value?: string) => void;
  strategyId: string;
  peerType: string;
  peerId: string;
  isDisabled?: boolean;
}

const AiNoteInput = ({
  color = "purple",
  note,
  setNote,
  strategyId,
  peerType,
  peerId,
  isDisabled,
}: AiNoteInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const successNote = useSuccessNotifier();
  const { mutate: sendPeerAiNote, isPending } = useSendPeerAiNote();
  const selectedColor = colorClasses[color] || colorClasses.purple;
  const [isLocalChange, setIsLocalChange] = useState(false);

  const debouncedNote = useDebounce(isLocalChange ? note : "", 1000);

  const handleSendPeerAiNote = () => {
    sendPeerAiNote(
      {
        peerId,
        peerType,
        strategyId,
        data: { ai_notes: debouncedNote },
      },
      {
        onSuccess: () => {
          setIsLocalChange(false);
          successNote({
            title: "AI note saved",
            description: "AI note saved successfully.",
          });
        },
        onError: (error) => {
          showAPIErrorToast(error, "Failed to save note");
        },
      }
    );
  };

  useEffect(() => {
    if (isDisabled || isPending || !debouncedNote?.trim()) {
      return;
    }
    handleSendPeerAiNote();
  }, [debouncedNote]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [note]);

  return (
    <div className="relative flex-1 flex items-center gap-2 nodrag">
      <Textarea
        rows={1}
        ref={textareaRef}
        disabled={isDisabled}
        readOnly={isDisabled}
        placeholder="Add notes for AI to use..."
        value={note}
        onChange={(e) => {
          if (!isDisabled) {
            setIsLocalChange(true);
            setNote(e.target.value);
          }
        }}
        className={cn(
          "text-gray-800 bg-white border-gray-200 pr-8 !min-h-10 nodrag",
          selectedColor.input,
          isDisabled && "cursor-not-allowed"
        )}
        aria-label="AI notes input"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
            aria-label="Help tooltip"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm max-w-[240px]">
            Add notes that will be used by AI to provide better context and
            insights.
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default AiNoteInput;
