"use client";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { IStrategy } from "@/lib/types";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { useDeleteStrategy } from "@/hooks/strategy/useStrategyMutations";
import { showAPIErrorToast } from "@/lib/utils";

export default function DeleteStrategyModal({
  isOpen,
  onClose,
  strategy,
}: {
  isOpen: boolean;
  onClose: () => void;
  strategy?: IStrategy | null;
}) {
  const successNote = useSuccessNotifier();
  const { mutate: deleteStrategy, isPending: isDeleting } = useDeleteStrategy();

  const handleDelete = () => {
    deleteStrategy(strategy?.id ?? "", {
      onSuccess: () => {
        successNote({
          title: "Strategy deleted",
          description: "Strategy deleted successfully",
        });
        onClose();
      },
      onError: (error) => {
        showAPIErrorToast(error);
      },
    });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        !isDeleting && onClose();
      }}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center px-4">
        <Dialog.Panel className="relative bg-white dark:bg-background w-full max-w-md mx-auto rounded-lg shadow-lg p-6">
          <button
            disabled={isDeleting}
            onClick={() => {
              !isDeleting && onClose();
            }}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <Dialog.Title className="text-xl font-semibold text-center mb-4">
            Delete Strategy
          </Dialog.Title>
          <div className="my-4 text-center">
            <p>
              {strategy
                ? `Are you sure you want to delete the strategy "${strategy.name}"? This action cannot be undone.`
                : "No strategy selected."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button
              disabled={isDeleting}
              onClick={() => {
                !isDeleting && onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
