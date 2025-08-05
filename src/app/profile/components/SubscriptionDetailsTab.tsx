import React from "react";
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

interface Props {
  profileData?: any;
  setShowPlanModal: Function;
  setShowBillingModal: Function;
  handleCancelSubscription: Function | any;
}

const SubscriptionDetailsTab = (props: Props) => {
  const {
    profileData,
    setShowPlanModal,
    setShowBillingModal,
    handleCancelSubscription,
  } = props;
  const { subscription, permissions } = profileData;

  return (
    <section>
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
                      This action cannot be undone. This will permanently cancel
                      your subscription.
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
    </section>
  );
};

export default SubscriptionDetailsTab;
