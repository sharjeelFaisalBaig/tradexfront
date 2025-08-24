"use client";

import { Dialog } from "@headlessui/react";
import { useEffect, useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { endpoints } from "@/lib/endpoints";
import { Input } from "../ui/input";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useTheme } from "next-themes";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function BuyCreditsForm({
  onSuccess,
  onClose,
}: {
  onSuccess: (data: any) => void;
  onClose: () => void;
}) {
  const successNote = useSuccessNotifier();

  const { data: session } = useSession();
  const stripe = useStripe();
  const elements = useElements();
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(100);
  const [creditInfo, setCreditInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchCreditInfo() {
      try {
        const data = await fetchWithAutoRefresh(
          endpoints.CREDITS.INFO,
          session
        );
        if (data?.status) {
          setCreditInfo(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch credit info", error);
      }
    }
    if (session) {
      fetchCreditInfo();
    }
  }, [session]);

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

    try {
      const paymentIntentResponse = await fetchWithAutoRefresh(
        endpoints.CREDITS.CREATE_PAYMENT_INTENT,
        session,
        {
          method: "POST",
          body: JSON.stringify({ credits }),
        }
      );

      if (
        !paymentIntentResponse?.status ||
        !paymentIntentResponse?.data?.client_secret
      ) {
        throw new Error(
          paymentIntentResponse?.message || "Failed to create payment intent."
        );
      }

      const clientSecret = paymentIntentResponse.data.client_secret;

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      const confirmResponse = await fetchWithAutoRefresh(
        endpoints.CREDITS.CONFIRM_PURCHASE,
        session,
        {
          method: "POST",
          body: JSON.stringify({
            payment_intent_id: paymentIntent?.id,
          }),
        }
      );

      if (!confirmResponse?.status) {
        throw new Error(
          confirmResponse?.message || "Failed to confirm credits purchase."
        );
      }

      successNote({
        title: "Purchase Successful",
        description: `${confirmResponse.data.credits_purchased} credits have been added to your account.`,
      });
      onSuccess(confirmResponse.data);
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
          Number of Credits
        </label>
        <Input
          type="number"
          value={credits}
          onChange={(e) => setCredits(Number(e.target.value))}
          min="1"
        />
        {creditInfo && (
          <p className="text-sm text-muted-foreground mt-2">
            {creditInfo.pricing_note}
          </p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-muted-foreground dark:text-gray-400 mb-2">
          Card Information
        </label>
        <div className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
          <CardElement options={{ ...cardElementOptions, disabled: loading }} />
        </div>
      </div>
      {error && (
        <div className="text-red-500 text-sm mb-4" role="alert">
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || loading || !creditInfo?.can_purchase_credits}
        className="w-full h-12 text-lg"
      >
        {loading
          ? "Processing..."
          : `Pay $${(credits * (creditInfo?.per_credit_price || 0)).toFixed(
              2
            )}`}
      </Button>
    </form>
  );
}

export default function BuyCreditsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
}) {
  const [successData, setSuccessData] = useState<any | null>(null);

  const handleClose = () => {
    const shouldRefresh = !!successData;
    setSuccessData(null);
    onClose(shouldRefresh);
  };

  const handleSuccess = (data: any) => {
    setSuccessData(data);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative dark:border dark:border-gray-800 bg-white dark:bg-background rounded-lg shadow-lg p-8 w-full max-w-md">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          {successData ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Purchase Successful!</h2>
              <p>
                <strong>Credits Purchased:</strong>{" "}
                {successData.credits_purchased}
              </p>
              <p>
                <strong>New Credit Balance:</strong>{" "}
                {successData.new_credit_balance}
              </p>
              <Button onClick={handleClose} className="mt-6">
                Close
              </Button>
            </div>
          ) : (
            <>
              <Dialog.Title className="text-2xl font-bold text-center mb-6">
                Buy Credits
              </Dialog.Title>
              <Elements stripe={stripePromise}>
                <BuyCreditsForm
                  onSuccess={handleSuccess}
                  onClose={handleClose}
                />
              </Elements>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
