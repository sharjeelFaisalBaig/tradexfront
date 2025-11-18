"use client";
import { useGetUser } from "@/hooks/auth/useAuth";
import RecentCreditsCard from "@/components/dashboard/RecentCreditsCard";
import BillingHistoryCard from "@/components/dashboard/BillingHistoryCard";
import DashboardCardsContainer from "@/components/dashboard/DashboardCardsContainer";
import RecentInteractedStrategiesCard from "@/components/dashboard/RecentInteractedStrategiesCard";
import SharedwithMeStrategiesCard from "@/components/dashboard/SharedwithMeStrategiesCard";

const Dashboard = () => {
  const { data, isLoading } = useGetUser();

  return (
    <main className="space-y-6">
      {/* for tiles of dastboard current credits, Credits Earned This Month, Credits Spent This Month, Membership Plan Details */}
      <DashboardCardsContainer isLoading={isLoading} profileData={data?.data} />

      <section className="grid grid-cols-2 gap-6">
        {/* Recent Credits Transactions */}
        <RecentCreditsCard isLoading={isLoading} profileData={data?.data} />
        <BillingHistoryCard isLoading={isLoading} profileData={data?.data} />
      </section>

      <RecentInteractedStrategiesCard
        isLoading={isLoading}
        profileData={data?.data}
      />

      <SharedwithMeStrategiesCard
        isLoading={isLoading}
        profileData={data?.data}
      />

      {/* <TradingViewChart /> */}
    </main>
  );
};

export default Dashboard;
