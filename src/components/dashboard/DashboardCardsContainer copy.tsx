import React, { useMemo } from "react";
import DashboardCard from "@/components/common/DashboardCard";
import { Card, CardContent } from "@/components/ui/card";
import { useGetUser } from "@/hooks/auth/useAuth";

const DashboardCardsContainer = () => {
  const { data, isLoading } = useGetUser();

  const credits = useMemo(() => data?.data?.credits, [data]);
  const subscription = useMemo(() => data?.data?.subscription, [data]);

  return (
    <section className="grid grid-cols-4 gap-6 mb-6">
      {/* current plan card */}
      <Card className="p-5 group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-lg">
        <CardContent className="p-0">
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
        </CardContent>
      </Card>

      <DashboardCard
        title={credits?.current_credits ?? 0}
        description={`Current Credits`}
      />
      <DashboardCard
        title={credits?.total_earned_this_month ?? 0}
        description={`Credits Earned This Month`}
      />
      <DashboardCard
        title={credits?.total_spent_this_month ?? 0}
        description={`Credits Spent This Month`}
      />

      {/* <DashboardCard
        title={subscription?.name ?? "No active subscription"}
        description={`Subscription Plan Details`}
      /> */}

      {/* <Card className="p-5 group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-lg">
        <CardContent className="p-0">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
            {!subscription ? "No active subscription" : subscription?.plan}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {"Membership Plan Details"}
          </p>
        </CardContent>
      </Card> */}
    </section>
  );
};

export default DashboardCardsContainer;
