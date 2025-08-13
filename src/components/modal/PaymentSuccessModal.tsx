"use client";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function PaymentSuccessModal({
  isOpen,
  onClose,
  successData,
}: {
  isOpen: boolean;
  onClose: () => void;
  successData?: any;
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center px-4">
        <Dialog.Panel className="relative dark:border dark:border-gray-800 bg-white dark:bg-background w-full max-w-md mx-auto rounded-lg shadow-lg p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <Dialog.Title className="text-xl font-semibold text-center mb-4 text-foreground">
            Payment Successful!
          </Dialog.Title>

          {/* Content */}
          <div className="my-4 text-center">
            {successData ? (
              <>
                <p className="text-lg font-medium">
                  Your subscription to{" "}
                  <span className="font-semibold text-primary">
                    {successData.subscription_name}
                  </span>{" "}
                  has been activated successfully.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Status:{" "}
                  <span className="capitalize">
                    {successData.stripe_status}
                  </span>
                </p>
                {successData.ends_at ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ends on:{" "}
                    {new Date(successData.ends_at).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    This subscription is currently ongoing.
                  </p>
                )}
              </>
            ) : (
              <p>No payment details available.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button onClick={onClose}>Close</Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
