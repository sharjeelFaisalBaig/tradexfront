"use client";

import { Dialog } from "@headlessui/react";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { endpoints } from "@/lib/endpoints";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function UpdatePaymentMethodForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const successNote = useSuccessNotifier();
  const stripe = useStripe();
  const elements = useElements();
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cardElementOptions = {
    style: {
      base: {
        color: theme === "dark" ? "#FFFFFF" : "#111827",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: theme === "dark" ? "#d1d5db" : "#6b7280",
        },
      },
      invalid: {
        color: "#ef4444",
        iconColor: "#ef4444",
      },
    },
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please try again in a few moments.");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found.");
      setLoading(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      setError(error.message || "An unexpected error occurred.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAutoRefresh(
        endpoints.SUBSCRIPTION.UPDATE_PAYMENT_METHOD,
        session,
        {
          method: "POST",
          body: JSON.stringify({
            payment_method_id: paymentMethod?.id,
          }),
        }
      );

      if (!response?.status) {
        throw new Error(
          response?.message || "Failed to update payment method."
        );
      }

      successNote({
        title: "Payment Method Updated",
        description: "Your payment method has been updated successfully.",
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-muted-foreground dark:text-gray-400 mb-2">
          New Card Information
        </label>
        <div className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      {error && (
        <div className="text-red-500 text-sm mb-4" role="alert">
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-12 text-lg"
      >
        {loading ? "Updating..." : "Update Payment Method"}
      </Button>
    </form>
  );
}

export default function UpdatePaymentMethodModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
}) {
  const handleSuccess = () => {
    onClose(true);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => onClose()}
      className="fixed inset-0 z-50"
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white dark:bg-background rounded-lg shadow-lg p-8 w-full max-w-md">
          <button
            onClick={() => onClose()}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <Dialog.Title className="text-2xl font-bold text-center mb-6">
            Update Payment Method
          </Dialog.Title>
          <Elements stripe={stripePromise}>
            <UpdatePaymentMethodForm
              onSuccess={handleSuccess}
              onClose={() => onClose()}
            />
          </Elements>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
