import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import DashboardCard from "./DashboardCard";
import Loader from "../common/Loader";

interface DashboardCardsContainerProps {
  isLoading?: boolean;
  profileData?: any;
}

const DashboardCardsContainer = (props: DashboardCardsContainerProps) => {
  const { isLoading, profileData } = props;

  const credits = useMemo(() => profileData?.credits, [profileData]);
  const subscription = useMemo(() => profileData?.subscription, [profileData]);

  return (
    <section className="grid grid-cols-4 gap-6">
      {/* Other Cards */}
      <DashboardCard
        isLoading={isLoading}
        title={credits?.current_credits ?? 0}
        description="Current Credits"
      />
      <DashboardCard
        isLoading={isLoading}
        title={credits?.total_earned_this_month ?? 0}
        description="Credits Earned This Month"
      />
      <DashboardCard
        isLoading={isLoading}
        title={credits?.total_spent_this_month ?? 0}
        description="Credits Spent This Month"
      />
      {/* Current Plan Card */}
      <DashboardCurrentPlanCard
        isLoading={isLoading}
        subscription={subscription}
      />
    </section>
  );
};

export default DashboardCardsContainer;

const DashboardCurrentPlanCard = ({
  className,
  subscription,
  isLoading,
}: any) => {
  const formatDate = (dateString: string) => {
    const options: any = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Card
      className={`p-5 group hover:shadow-lg transition-shadow overflow-hidden rounded-lg ${className}`}
    >
      <CardContent className="p-0 relative">
        {!isLoading && (
          <span className="absolute -top-3 -right-3 z-10 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
            {subscription?.stripe_status || "Inactive"}
          </span>
        )}

        <h4 className="font-medium text-lg text-gray-900 dark:text-white">
          {isLoading ? (
            <Loader size="sm" text="" />
          ) : (
            subscription?.name || "No active subscription"
          )}
        </h4>

        {!subscription ? (
          <p className="text-sm text-muted-foreground mt-2">Current Plan</p>
        ) : (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground">
              Plan Cost:{" "}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ${subscription?.current_plan?.monthly_price || "0.00"}/month
              </span>
            </p>

            <p className="text-xs text-muted-foreground">
              Monthly Credits:{" "}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {subscription?.current_plan?.monthly_credits || "0"}
              </span>
            </p>

            <p className="text-xs text-muted-foreground">
              Renewal Date:{" "}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {subscription?.created_at
                  ? formatDate(subscription.created_at)
                  : "N/A"}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
