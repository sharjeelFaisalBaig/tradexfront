"use client";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { endpoints } from "@/lib/endpoints";
import { X } from "lucide-react";
import { useTheme } from "next-themes";

export default function CheckoutForm({
  plan,
  billingType,
  onClose,
  onSuccess,
  isUpdate,
}: {
  plan: any;
  billingType: "monthly" | "annual";
  onClose: () => void;
  onSuccess: (data: any) => void;
  isUpdate?: boolean;
}) {
  const { data: session } = useSession();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

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
      // 1. Create or Update Subscription
      const endpoint = isUpdate
        ? endpoints.SUBSCRIPTION.UPDATE_SUBSCRIPTION
        : endpoints.SUBSCRIPTION.CREATE_PAYMENT_INTENT;

      const body = isUpdate
        ? {
            new_membership_plan_id: plan.id,
            new_billing_cycle: billingType,
          }
        : {
            membership_plan_id: plan.id,
            billing_cycle: billingType,
          };

      const paymentIntentResponse = await fetchWithAutoRefresh(
        endpoint,
        session,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      if (!paymentIntentResponse?.status) {
        throw new Error(
          paymentIntentResponse?.message ||
            "Failed to process subscription change."
        );
      }

      // If there's a client_secret, it means a payment is required.
      if (paymentIntentResponse.data.client_secret) {
        const clientSecret = paymentIntentResponse.data.client_secret;

        // 2. Confirm the card payment
        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
            },
          });

        if (stripeError) {
          console.error("Stripe confirmation error:", stripeError);
          throw new Error(
            stripeError.message || "Failed to confirm payment with Stripe."
          );
        }

        if (!paymentIntent || !paymentIntent.id) {
          throw new Error("Payment Intent not found after confirmation.");
        }

        // 3. Confirm the subscription on the server
        const confirmResponse = await fetchWithAutoRefresh(
          endpoints.SUBSCRIPTION.CONFIRM_PAYMENT,
          session,
          {
            method: "POST",
            body: JSON.stringify({
              payment_intent_id: paymentIntent.id,
            }),
          }
        );

        if (!confirmResponse?.status) {
          throw new Error(
            confirmResponse?.message ||
              "Failed to confirm subscription on the server."
          );
        }

        onSuccess(confirmResponse.data);
      } else {
        // No payment required, the subscription was updated directly.
        onSuccess(paymentIntentResponse.data);
      }
    } catch (err: any) {
      console.error("Payment processing error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
          Complete Your Purchase
        </h2>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 text-center">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            {plan.name}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {billingType === "monthly"
              ? `$${plan.monthly_price}`
              : `$${plan.annual_price}`}
            <span className="text-base font-medium text-gray-500 dark:text-gray-400">
              /{billingType}
            </span>
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground dark:text-gray-400 mb-2">
              Card Information
            </label>
            <div className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
              <CardElement key={theme} options={cardElementOptions} />
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
            {loading ? "Processing..." : "Pay Now"}
          </Button>
        </form>
      </div>
    </div>
  );
}
