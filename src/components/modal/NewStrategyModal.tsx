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
import { useGetStrategiesTags } from "@/hooks/strategy/useStrategyQueries";
import CreatableSelect from "react-select/creatable";

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
  const { data: allStrategyTags, isLoading: isLoadingTags } =
    useGetStrategiesTags();
  const createMutation = useCreateStrategy();
  const updateMutation = useUpdateStrategy();

  const [name, setName] = useState(strategy?.name ?? "");
  const [desc, setDesc] = useState(strategy?.description ?? "");
  const [tagInput, setTagInput] = useState("");
  strategy.tags = Array.isArray(strategy?.tags)
    ? strategy?.tags
    : JSON.parse(strategy?.tags);

  const [tags, setTags] = useState<{ label: string; value: string }[]>(
    strategy?.tags && strategy?.tags?.length > 0
      ? strategy?.tags?.map((tag) => ({ label: tag, value: tag }))
      : []
  );
  const [errors, setErrors] = useState<{
    name?: string;
    desc?: string;
    tags?: string;
  }>({});

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
      tags: tags.map((tag) => tag.value),
    };

    const onMutationSuccess = (data: any) => {
      successNote({
        title: strategy ? "Strategy Updated" : "Strategy Created",
        description: `Strategy ${
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
        {!isLoadingTags && allStrategyTags?.data?.tags && (
          <CreatableSelect
            isMulti
            options={allStrategyTags?.data?.tags.map((tag: any) => ({
              label: tag,
              value: tag,
            }))}
            value={tags}
            onChange={(selected) =>
              setTags(selected as { label: string; value: string }[])
            }
            isLoading={isLoadingTags}
            isDisabled={isLoading}
          />
        )}
        {errors.tags && (
          <p className="mt-1 text-sm text-red-500">{errors.tags}</p>
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
        <Dialog.Panel className="relative dark:border dark:border-gray-800 bg-white dark:bg-background w-full max-w-md mx-auto rounded-lg shadow-lg p-6">
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
