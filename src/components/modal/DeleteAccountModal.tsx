"use client";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { showAPIErrorToast } from "@/lib/utils";
import { useDeleteUserAccountMutation } from "@/hooks/auth/useAuth";

export default function DeleteAccountModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const successNote = useSuccessNotifier();
  const { mutate: deleteAccount, isPending: isDeleting } =
    useDeleteUserAccountMutation();

  const handleDelete = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        successNote({
          title: "Account deletion scheduled",
          description:
            "Your account deletion request has been received and is scheduled for 20 days from today. You can cancel the request before that date.",
        });
        onClose();
      },
      onError: (error: any) => {
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
        <Dialog.Panel className="relative dark:border dark:border-gray-800 bg-white dark:bg-background w-full max-w-md mx-auto rounded-lg shadow-lg p-6">
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

          <Dialog.Title className="text-xl font-semibold text-center mb-4 text-red-600">
            Delete Account
          </Dialog.Title>

          <div className="my-4 text-center space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Deleting your account will remove all your personal data, credits,
              and related information from our system. This action cannot be
              undone.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
              Your account deletion will be scheduled 20 days from today. You
              can cancel the request any time before that date.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
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
              {isDeleting ? "Scheduling..." : "Confirm Deletion"}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
