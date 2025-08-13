import React from "react";

interface Props {
  profileData?: any;
}

const BillingDetailsTab = (props: Props) => {
  const { profileData } = props;
  const { permissions } = profileData;

  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mb-6">Permissions</h2>
        <div className="border border-border rounded-lg p-6 bg-white dark:bg-muted/50">
          <div>
            Can Subscribe: <b>{permissions?.can_subscribe ? "Yes" : "No"}</b>
          </div>
          {permissions?.subscription_block_reason && (
            <div className="text-red-600 mt-2">
              Block Reason: {permissions.subscription_block_reason}
            </div>
          )}
        </div>
      </section>

      
    </>
  );
};

export default BillingDetailsTab;
