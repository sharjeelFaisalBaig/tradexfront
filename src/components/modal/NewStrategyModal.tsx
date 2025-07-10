"use client";

import { Dialog } from "@headlessui/react";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { endpoints } from "@/lib/endpoints";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { IStrategy } from "@/lib/types";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";

function NewStrategyForm({
  onSuccess,
  onClose,
}: {
  onSuccess: (data: IStrategy) => void;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; desc?: string }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; desc?: string } = {};

    if (!name.trim()) newErrors.name = "Strategy name is required.";
    if (!desc.trim()) newErrors.desc = "Description is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetchWithAutoRefresh(
        endpoints.STRATEGY.CREATE,
        session,
        {
          method: "POST",
          body: JSON.stringify({ name, desc }),
        }
      );

      if (!response?.status) {
        throw new Error(response?.message || "Failed to create strategy.");
      }

      toast({
        title: "Strategy Created",
        description: `Strategy "${name}" was created successfully.`,
      });

      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

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

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-base"
      >
        {loading ? "Creating..." : "Create Strategy"}
      </Button>
    </form>
  );
}

export default function NewStrategyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const onSuccess = (strategyData: IStrategy) => {
    router.push(`/strategies/${strategyData.id}`);
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
            Create New Strategy
          </Dialog.Title>

          <NewStrategyForm onSuccess={onSuccess} onClose={onClose} />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
