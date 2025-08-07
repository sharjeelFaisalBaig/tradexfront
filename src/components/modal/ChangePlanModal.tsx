"use client";

import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { X } from "lucide-react";
import { endpoints } from "@/lib/endpoints";
import { useSession } from "next-auth/react";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import Loader from "../common/Loader";
import { toast } from "@/hooks/use-toast";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function ChangePlanModal({
  isOpen,
  onClose,
  subscription,
}: {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  subscription: any;
}) {
  const { data: session } = useSession();
  const [billingType, setBillingType] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [hasAnnualPlan, setHasAnnualPlan] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      try {
        const data = await fetchWithAutoRefresh(
          endpoints.PLANS.GET_ALL_PLANS,
          session
        );
        if (data?.status && data?.data?.plans) {
          setPlans(data.data.plans);
          setHasAnnualPlan(data.data.plans.some((p: any) => p.is_annual));
        } else {
          setPlans([]);
        }
      } catch (e) {
        setPlans([]);
        console.error("Error fetching plans:", e);
      }
      setLoading(false);
    }
    if (isOpen && session?.accessToken) fetchPlans();
  }, [isOpen, session?.accessToken]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSubscribeClick = async (plan: any) => {
    if (subscription) {
      // Check if user can change plan
      try {
        const eligibilityResponse = await fetchWithAutoRefresh(
          endpoints.PLANS.CAN_CHANGE_PLAN,
          session,
          {
            method: "POST",
            body: JSON.stringify({ new_membership_plan_id: plan.id }),
          }
        );

        if (!eligibilityResponse?.status) {
          toast({
            title: "Eligibility Check Failed",
            description:
              eligibilityResponse?.message ||
              "You are not eligible to switch to this plan.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while checking plan eligibility.",
          variant: "destructive",
        });
        return;
      }
    }
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleClose = () => {
    const shouldRefresh = !!successData;
    setShowCheckout(false);
    setSelectedPlan(null);
    setSuccessData(null);
    onClose(shouldRefresh);
  };

  const handleSuccess = (data: any) => {
    setSuccessData(data);
    setShowCheckout(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative dark:border dark:border-gray-800 bg-white dark:bg-background rounded-lg shadow-lg p-8 w-full max-w-5xl">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {successData ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
              <p>
                <strong>Subscription ID:</strong> {successData.subscription_id}
              </p>
              <p>
                <strong>Plan:</strong> {successData.subscription_name}
              </p>
              <p>
                <strong>Status:</strong> {successData.stripe_status}
              </p>
              <Button onClick={handleClose} className="mt-6">
                Close
              </Button>
            </div>
          ) : showCheckout && selectedPlan ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                plan={selectedPlan}
                billingType={billingType}
                onClose={() => setShowCheckout(false)}
                onSuccess={handleSuccess}
                isUpdate={!!subscription}
              />
            </Elements>
          ) : (
            <>
              <Dialog.Title className="text-2xl font-bold text-center mb-2">
                Choose Your Plan
              </Dialog.Title>
              <p className="text-sm text-muted-foreground text-center mb-6">
                No contracts, no surprise fees.
              </p>
              <div className="flex justify-center mb-8">
                <div className="inline-flex bg-muted rounded-lg p-1">
                  <button
                    className={clsx(
                      "px-4 py-1 text-sm rounded-lg transition-all",
                      billingType === "monthly"
                        ? "bg-primary text-white dark:bg-background"
                        : "text-muted-foreground"
                    )}
                    onClick={() => setBillingType("monthly")}
                  >
                    Monthly
                  </button>
                  {hasAnnualPlan && (
                    <button
                      className={clsx(
                        "px-4 py-1 text-sm rounded-lg transition-all",
                        billingType === "annual"
                          ? "bg-primary text-white dark:bg-background"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setBillingType("annual")}
                    >
                      Yearly
                    </button>
                  )}
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader text="Loading plans..." />
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-12 text-red-500">
                  No plans found.
                </div>
              ) : (
                <div
                  className={`grid grid-cols-1 md:grid-cols-${
                    plans.length > 2 ? 3 : plans.length
                  } gap-6`}
                >
                  {plans.map((plan) => {
                    const showAnnual =
                      billingType === "annual" && plan.is_annual;
                    if (billingType === "annual" && !plan.is_annual) {
                      return null;
                    }
                    return (
                      <div
                        key={plan.id}
                        className="border rounded-xl p-6 text-center transition-all shadow-sm bg-white dark:bg-muted/50"
                      >
                        <h3 className="text-xl font-semibold mb-1">
                          {plan.name}
                        </h3>
                        <p className="text-3xl font-bold mb-2">
                          {showAnnual
                            ? `$${plan.annual_price}`
                            : `$${plan.monthly_price}`}
                          <span className="text-base font-medium">
                            {" "}
                            /{billingType}
                          </span>
                        </p>
                        <ul className="text-sm mb-6 space-y-2 text-left mt-4 text-muted-foreground">
                          <li>Credits: {plan.monthly_credits}</li>
                          <li>USD per credit: {plan.usd_per_credit}</li>
                          {plan.description && (
                            <li
                              dangerouslySetInnerHTML={{
                                __html: plan.description,
                              }}
                            />
                          )}
                        </ul>
                        <Button
                          className="w-full"
                          onClick={() => handleSubscribeClick(plan)}
                          disabled={subscription?.name === plan.name}
                        >
                          {subscription?.name === plan.name
                            ? "Current Plan"
                            : "Subscribe"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
