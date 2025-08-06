import { Button } from "@/components/ui/button";
import React from "react";

interface Props {
  profileData?: any;
  setShowBuyCreditsModal: Function;
}

const CreditsDetailsTab = (props: Props) => {
  const { profileData, setShowBuyCreditsModal } = props;
  const { credits } = profileData;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6">Credits</h2>
      <div className="border border-border rounded-lg p-6 bg-white dark:bg-muted/50">
        <div className="mb-2">
          Current Credits: <b>{credits?.current_credits ?? 0}</b>
        </div>
        <div className="mb-2">
          Total Earned This Month:{" "}
          <b>{credits?.total_earned_this_month ?? 0}</b>
        </div>
        <div className="mb-2">
          Total Spent This Month: <b>{credits?.total_spent_this_month ?? 0}</b>
        </div>
        <h3 className="text-lg font-semibold mt-4">Recent Activities</h3>
        <ul>
          {credits?.recent_activities.map((activity: any) => (
            <li key={activity.id} className="text-sm text-muted-foreground">
              {new Date(activity.created_at).toLocaleString()}:{" "}
              {activity.reason} ({activity.action_type}{" "}
              {activity.amount_changed})
            </li>
          ))}
        </ul>
        <Button className="mt-4" onClick={() => setShowBuyCreditsModal(true)}>
          Buy Credits
        </Button>
      </div>
    </section>
  );
};

export default CreditsDetailsTab;
