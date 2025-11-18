"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  allTags: string[];
}

const MAX_TAGS = 4;

export default function TagSelector({
  value,
  onChange,
  allTags,
}: TagSelectorProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const isLimitReached = value.length >= MAX_TAGS;

  useEffect(() => {
    if (!input || isLimitReached) {
      setSuggestions([]);
      return;
    }

    const lower = input.toLowerCase();
    const filtered = allTags.filter(
      (tag) => tag.toLowerCase().includes(lower) && !value.includes(tag)
    );
    setSuggestions(filtered);
  }, [input, allTags, value, isLimitReached]);

  const addTag = (tag: string) => {
    if (!value.includes(tag) && !isLimitReached) {
      onChange([...value, tag]);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input.trim());
    }
  };

  const handleClickSuggestion = (tag: string) => {
    addTag(tag);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="w-full flex items-center gap-2">
      {/* Input with Tag Icon */}
      <div className="relative">
        <div className="absolute left-2 top-0 flex items-center justify-center h-full">
          <Tag className="w-5 h-5" color="#0088cc" />
        </div>
        <Input
          placeholder="Add tag..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLimitReached}
          className={cn("pl-8 rounded-full", isLimitReached && "opacity-50")}
        />

        {/* {input && !isLimitReached && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-md max-h-60 overflow-y-auto dark:bg-background">
            {suggestions.length > 0 ? (
              suggestions.map((tag) => (
                <div
                  key={tag}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                  onClick={() => handleClickSuggestion(tag)}
                >
                  {tag}
                </div>
              ))
            ) : (
              <div
                className="px-3 py-2 text-sm cursor-pointer hover:bg-muted flex items-center gap-2"
                onClick={() => addTag(input.trim())}
              >
                <Plus className="w-4 h-4" />
                Create tag: <span className="font-medium">{input}</span>
              </div>
            )}
          </div>
        )} */}
      </div>

      {/* Render Added Tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value?.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="flex items-center gap-1 pl-3 pr-2 py-1 text-sm h-fit bg-white"
            >
              {tag}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
