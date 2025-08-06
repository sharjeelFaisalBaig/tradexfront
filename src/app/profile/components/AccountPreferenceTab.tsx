import React from "react";
import SwitchCard from "./SwitchCard";

interface Props {
  profileData?: any;
  twoFactor: boolean;
  setTwoFactor: (val: boolean) => void;
  emailNotifications: boolean;
  setEmailNotifications: (val: boolean) => void;
  inAppNotifications: boolean;
  setInAppNotifications: (val: boolean) => void;
  autoRenewal: boolean;
  setAutoRenewal: (val: boolean) => void;
  receiveSuccessAlerts: boolean;
  setReceiveSuccessAlerts: (val: boolean) => void;
}

const AccountPreferenceTab = (props: Props) => {
  const {
    profileData,
    twoFactor,
    setTwoFactor,
    emailNotifications,
    setEmailNotifications,
    inAppNotifications,
    setInAppNotifications,
    autoRenewal,
    setAutoRenewal,
    receiveSuccessAlerts,
    setReceiveSuccessAlerts,
  } = props;

  return (
    <section className="">
      <h2 className="text-xl font-semibold mb-6">Account Preferences</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <SwitchCard
          title="Email Notifications"
          description="Receive email updates about your account"
          checked={emailNotifications}
          onChange={setEmailNotifications}
        />
        <SwitchCard
          title="In-App Notifications"
          description="Receive notifications inside the app"
          checked={inAppNotifications}
          onChange={setInAppNotifications}
        />
        <SwitchCard
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
          checked={twoFactor}
          onChange={setTwoFactor}
        />
        <SwitchCard
          title="Auto-renewal"
          description="Automatically renew subscription"
          checked={autoRenewal}
          onChange={setAutoRenewal}
        />
        <SwitchCard
          title="Receive Success Alerts"
          description="Enable to get notified when actions like creating strategies or other tasks complete successfully."
          checked={receiveSuccessAlerts}
          onChange={setReceiveSuccessAlerts}
        />
      </div>
    </section>
  );
};

export default AccountPreferenceTab;
