import React, { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import SwitchCard from "./SwitchCard";
import { useGetSubscriptionPlans } from "@/hooks/auth/useAuth";
import clsx from "clsx";
import Loader from "@/components/common/Loader";
import { toast } from "@/hooks/use-toast";
import { canChangePlan } from "@/services/auth/auth_API";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/modal/CheckoutForm";
import { loadStripe } from "@stripe/stripe-js";
import PaymentSuccessModal from "@/components/modal/PaymentSuccessModal";

type BillingType = "monthly" | "annual";
interface Props {
  profileData?: any;
  setShowPlanModal: Function;
  setShowBillingModal: Function;
  handleCancelSubscription: Function | any;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const SubscriptionDetailsTab = (props: Props) => {
  const {
    profileData,
    setShowPlanModal,
    setShowBillingModal,
    handleCancelSubscription,
  } = props;
  const { subscription, permissions } = profileData;

  // states
  const [billingType, setBillingType] = useState<BillingType>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [hasAnnualPlan, setHasAnnualPlan] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  // queries
  const { data: plansData, isLoading: isLoadingPlans } =
    useGetSubscriptionPlans({ enabled: true });

  useEffect(() => {
    if (plansData?.data?.plans) {
      setPlans(plansData?.data?.plans);
      setHasAnnualPlan(plansData?.data?.plans?.some((p: any) => p.is_annual));
    } else {
      setPlans([]);
    }
  }, [plansData]);

  const handleSubscribeClick = async (plan: any) => {
    if (subscription) {
      // Check if user can change plan
      try {
        const eligibilityResponse = await canChangePlan({
          new_membership_plan_id: plan.id,
        });

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

  const handleSuccess = (data: any) => {
    setSuccessData(data);
    setShowCheckout(false);
  };

  const handleClose = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
    setSuccessData(null);
  };

  const currentPlan = useMemo(() => subscription?.current_plan, [subscription]);

  return (
    <>
      {/* <section>
        <h2 className="text-xl font-semibold mb-6">Subscription Management</h2>
        <div className="border border-border rounded-lg p-6 bg-white dark:bg-muted/50">
          <div className="mb-6 p-4 border border-border rounded-lg flex justify-between gap-6">
            <div>
              <h3 className="font-medium mb-1">Current Plan</h3>
              <p className="text-sm text-muted-foreground">
                {subscription ? subscription.name : "No active subscription"}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400 mb-1">
                {subscription ? subscription.stripe_status : "Inactive"}
              </span>
              {subscription && subscription.current_plan && (
                <>
                  <p className="font-semibold">
                    $
                    {subscription.current_plan.is_annual
                      ? subscription.current_plan.annual_price
                      : subscription.current_plan.monthly_price}
                    /{subscription.current_plan.is_annual ? "year" : "month"}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button
                className="bg-[#0088CC] hover:bg-[#0077b3] text-white"
                onClick={() => setShowPlanModal(true)}
              >
                Change Plan
              </Button>
              <Button
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-800/30 dark:hover:bg-green-800/20"
                onClick={() => setShowBillingModal(true)}
              >
                Billing History
              </Button>
              {subscription && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Cancel Subscription</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        cancel your subscription.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelSubscription}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            {!permissions?.can_subscribe &&
              permissions?.subscription_block_reason && (
                <p className="text-sm text-red-500">
                  {permissions.subscription_block_reason}
                </p>
              )}
          </div>
        </div>
      </section> */}

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-6">Subscription Management</h2>
        {!currentPlan?.id && (
          <h2 className="text-xl font-semibold mb-6 text-center">
            Choose Your Plan
          </h2>
        )}
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
        {isLoadingPlans ? (
          <div className="flex justify-center py-12">
            <Loader text="Loading plans..." />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-red-500">No plans found.</div>
        ) : (
          <div
            className={`grid grid-cols-1 md:grid-cols-${
              plans.length > 2 ? 3 : plans.length
            } gap-6`}
          >
            {plans.map((plan) => {
              const isActive = currentPlan?.id === plan?.id;
              const showAnnual = billingType === "annual" && plan.is_annual;

              if (billingType === "annual" && !plan.is_annual) {
                return null;
              }

              return (
                <div
                  key={plan.id}
                  className="relative flex flex-col border rounded-xl p-6 text-center transition-all shadow-sm bg-white dark:bg-muted/50"
                >
                  {isActive && (
                    <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400 mb-1">
                      {subscription ? subscription.stripe_status : "Inactive"}
                    </span>
                  )}
                  <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-3xl font-bold mb-2">
                    {showAnnual
                      ? `$${plan.annual_price}`
                      : `$${plan.monthly_price}`}
                    <span className="text-base font-medium">
                      {` Per ${billingType === "annual" ? "Year" : "Month"}`}
                    </span>
                  </p>
                  <span className="text-base font-medium">
                    Credits: {plan.monthly_credits}
                  </span>
                  <ul className="text-sm mb-6 space-y-2 text-center mt-4 text-muted-foreground">
                    {plan.description && (
                      <li
                        dangerouslySetInnerHTML={{
                          __html: plan.description,
                        }}
                      />
                    )}
                  </ul>
                  <Button
                    className="w-full mt-auto"
                    onClick={() => handleSubscribeClick(plan)}
                    disabled={subscription?.name === plan.name}
                  >
                    {isActive ? "Current Plan" : "Subscribe"}
                  </Button>
                  {isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="link" className="text-red-500">
                          Cancel Subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            cancel your subscription.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancelSubscription}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showCheckout && selectedPlan && (
        <Elements stripe={stripePromise}>
          <CheckoutForm
            plan={selectedPlan}
            billingType={billingType}
            onClose={() => setShowCheckout(false)}
            onSuccess={handleSuccess}
            isUpdate={!!subscription}
          />
        </Elements>
      )}

      {!!successData && (
        <PaymentSuccessModal
          isOpen={!!successData}
          onClose={handleClose}
          successData={successData}
        />
      )}
    </>
  );
};

export default SubscriptionDetailsTab;
