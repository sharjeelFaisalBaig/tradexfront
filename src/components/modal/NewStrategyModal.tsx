"use client";

import { Dialog } from "@headlessui/react";
import { useState, FormEvent, KeyboardEvent, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { IStrategy } from "@/lib/types";
import { Textarea } from "../ui/textarea";
import { cn, showAPIErrorToast } from "@/lib/utils";
import {
  useCreateStrategy,
  useUpdateStrategy,
} from "@/hooks/strategy/useStrategyMutations";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

const MAX_TAGS = 4; // maximum allowed tags

function NewStrategyForm({
  onSuccess,
  onClose,
  strategy,
}: {
  onSuccess: (data: IStrategy) => void;
  onClose: () => void;
  strategy?: IStrategy | null;
}) {
  // const pathname = usePathname();
  // const strategyId = pathname.split("/")[2];
  const successNote = useSuccessNotifier();
  const createMutation = useCreateStrategy();
  const updateMutation = useUpdateStrategy();

  const [name, setName] = useState(strategy?.name ?? "");
  const [desc, setDesc] = useState(strategy?.description ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(strategy?.tags ?? []);
  const [errors, setErrors] = useState<{
    name?: string;
    desc?: string;
    tags?: string;
  }>({});

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag) && tags.length < MAX_TAGS) {
      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string; desc?: string; tags?: string } = {};
    // if (!name.trim()) newErrors.name = "Strategy name is required.";
    // if (!desc.trim()) newErrors.desc = "Description is required.";
    // if (tags.length === 0) newErrors.tags = "Please add at least one tag.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const payload = {
      name,
      description: desc,
      tags,
    };

    const onMutationSuccess = (data: any) => {
      successNote({
        title: strategy ? "Strategy Updated" : "Strategy Created",
        description: `Strategy "${data?.data?.name}" ${
          strategy ? "updated" : "created"
        } successfully.`,
      });
      onSuccess(data?.data); // assuming response has `data`
      onClose();
    };

    if (strategy) {
      updateMutation.mutate(
        { id: strategy.id, data: payload },
        {
          onSuccess: onMutationSuccess,
          onError: (error) => {
            updateMutation?.isError && showAPIErrorToast(error);
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: onMutationSuccess,
        onError: (error) => {
          createMutation?.isError && showAPIErrorToast(error);
        },
      });
    }
  };

  const isLoading = useMemo(
    () => createMutation?.isPending || updateMutation?.isPending,
    [createMutation, updateMutation]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1 text-muted-foreground">
          Name
        </label>
        <Input
          type="text"
          placeholder="e.g. My AI Campaign"
          disabled={isLoading}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(
            errors.name && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1 text-muted-foreground">
          Description
        </label>
        <Textarea
          disabled={isLoading}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Describe your strategy..."
          rows={4}
          className={cn(
            errors.desc && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {errors.desc && (
          <p className="mt-1 text-sm text-red-500">{errors.desc}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1 text-muted-foreground">
          Tags
        </label>
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a tag and press enter or comma"
          disabled={isLoading || tags.length >= MAX_TAGS} // disable input if limit reached
          className={cn(
            errors.tags && "border-red-500 focus-visible:ring-red-500",
            tags.length >= MAX_TAGS && "opacity-50 cursor-not-allowed"
          )}
        />
        {errors.tags && (
          <p className="mt-1 text-sm text-red-500">{errors.tags}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center px-3 py-1 text-sm bg-muted rounded-full text-muted-foreground"
              >
                {tag}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-red-500 hover:text-red-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 text-base"
      >
        {strategy
          ? updateMutation.isPending
            ? "Updating..."
            : "Update Strategy"
          : createMutation.isPending
          ? "Creating..."
          : "Create Strategy"}
      </Button>
    </form>
  );
}

export default function NewStrategyModal({
  isOpen,
  onClose,
  strategy,
}: {
  isOpen: boolean;
  onClose: () => void;
  strategy?: IStrategy | null;
}) {
  const router = useRouter();

  const onSuccess = (strategyData: IStrategy) => {
    if (!strategy?.id) {
      router.push(`/strategies/${strategyData.id}`);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center px-4">
        <Dialog.Panel className="relative bg-white dark:bg-background w-full max-w-md mx-auto rounded-lg shadow-lg p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <Dialog.Title className="text-xl font-semibold text-center mb-4">
            {strategy ? "Update Strategy" : "Create New Strategy"}
          </Dialog.Title>

          <NewStrategyForm
            strategy={strategy}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
