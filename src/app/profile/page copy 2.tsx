"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import ProfileHeader from "./components/ProfileHeader";
import ChangePlanModal from "@/components/modal/ChangePlanModal";
import BillingHistoryModal from "@/components/modal/BillingHistoryModal";
import BuyCreditsModal from "@/components/modal/BuyCreditsModal";
import UpdatePaymentMethodModal from "@/components/modal/UpdatePaymentMethodModal";
import { endpoints } from "@/lib/endpoints";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import Loader from "@/components/common/Loader";
import { toast } from "@/hooks/use-toast";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import PersonalInfoTab from "./components/PersonalInfoTab";
import AccountPreferenceTab from "./components/AccountPreferenceTab";
import SubscriptionDetailsTab from "./components/SubscriptionDetailsTab";
import CreditsDetailsTab from "./components/CreditsDetailsTab";
import BillingDetailsTab from "./components/BillingDetailsTab";
import ProfileSidebar from "./components/ProfileSidebar";

const tabs = [
  { name: "Personal Information", value: "personal" },
  { name: "Account Preference", value: "account" },
  { name: "Subscription Details", value: "subscription" },
  { name: "Credits Details", value: "credits" },
  { name: "Billing Details", value: "billing" },
];

function ProfilePage() {
  const successNote = useSuccessNotifier();

  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showUpdatePaymentMethodModal, setShowUpdatePaymentMethodModal] =
    useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatar, setAvatar] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [receiveSuccessAlerts, setReceiveSuccessAlerts] = useState(true);

  const fetchedRef = useRef(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }
      const data = await fetchWithAutoRefresh(endpoints.USER.PROFILE, session);

      if (data?.status && data?.data?.user) {
        setProfile(data.data);
        setFirstName(data.data.user.first_name || "");
        setLastName(data.data.user.last_name || "");
        setEmail(data.data.user.email || "");
        setPhoneNumber(data.data.user.phone_number || "");
        setAvatar(data.data.user.avatar || "");
        setEmailNotifications(!!data.data.user.receive_email_notifications);
        setInAppNotifications(!!data.data.user.receive_inapp_notifications);
        setTwoFactor(!!data.data.user.two_factor_enabled);
        setReceiveSuccessAlerts(!!data?.data?.user?.receive_success_alerts);
      }
    } catch (e) {
      // handle error
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session?.accessToken && !fetchedRef.current) {
      fetchProfile();
      fetchedRef.current = true;
    }
  }, [session?.accessToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
        <Loader text="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-red-600 text-lg font-semibold">
          Failed to load profile.
        </span>
      </div>
    );
  }

  const { subscription } = profile;

  const handleSaveChanges = async () => {
    const updatedProfile = {
      name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      email: email,
      receive_email_notifications: emailNotifications,
      receive_inapp_notifications: inAppNotifications,
      two_factor_enabled: twoFactor,
      receive_success_alerts: receiveSuccessAlerts,
      avatar: avatar,
    };

    try {
      const data = await fetchWithAutoRefresh(
        endpoints.USER.UPDATE_PROFILE,
        session,
        {
          method: "PUT",
          body: JSON.stringify(updatedProfile),
        }
      );

      if (data?.status) {
        successNote({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
        fetchProfile(); // Refresh profile data
      } else {
        toast({
          title: "Error",
          description: data?.message || "Failed to update profile.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const data = await fetchWithAutoRefresh(
        endpoints.SUBSCRIPTION.CANCEL_SUBSCRIPTION,
        session,
        {
          method: "POST",
        }
      );

      if (data?.status) {
        successNote({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled successfully.",
        });
        fetchProfile(); // Refresh profile data
      } else {
        toast({
          title: "Error",
          description: data?.message || "Failed to cancel subscription.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const data = await fetchWithAutoRefresh(
        endpoints.USER.UPLOAD_AVATAR,
        session,
        {
          method: "POST",
          body: formData,
        }
      );

      if (data?.status) {
        successNote({
          title: "Avatar Uploaded",
          description: "Your avatar has been updated successfully.",
        });
        fetchProfile(); // Refresh profile data
      } else {
        toast({
          title: "Error",
          description: data?.message || "Failed to upload avatar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarDelete = async () => {
    try {
      const data = await fetchWithAutoRefresh(
        endpoints.USER.DELETE_AVATAR,
        session,
        {
          method: "DELETE",
        }
      );

      if (data?.status) {
        successNote({
          title: "Avatar Deleted",
          description: "Your avatar has been deleted successfully.",
        });
        fetchProfile(); // Refresh profile data
      } else {
        toast({
          title: "Error",
          description: data?.message || "Failed to delete avatar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <ProfileHeader onSave={handleSaveChanges} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ProfileSidebar
          profileData={profile}
          handleAvatarUpload={handleAvatarUpload}
        />

        {/* Main Content */}
        <main className="flex-1 px-12 py-10 overflow-y-auto bg-background">
          <div className="flex border-b border-gray-300">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
                  activeTab === tab.value
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-black"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeTab === "personal" && (
              <PersonalInfoTab
                profileData={profile}
                email={email}
                setEmail={setEmail}
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                setShowUpdatePaymentMethodModal={
                  setShowUpdatePaymentMethodModal
                }
                handleAvatarDelete={handleAvatarDelete}
              />
            )}
            {activeTab === "account" && (
              <AccountPreferenceTab
                profileData={profile}
                twoFactor={twoFactor}
                setTwoFactor={setTwoFactor}
                autoRenewal={autoRenewal}
                setAutoRenewal={setAutoRenewal}
                emailNotifications={emailNotifications}
                setEmailNotifications={setEmailNotifications}
                inAppNotifications={inAppNotifications}
                setInAppNotifications={setInAppNotifications}
                receiveSuccessAlerts={receiveSuccessAlerts}
                setReceiveSuccessAlerts={setReceiveSuccessAlerts}
              />
            )}
            {activeTab === "subscription" && (
              <SubscriptionDetailsTab
                profileData={profile}
                // setShowPlanModal={setShowPlanModal}
                // setShowBillingModal={setShowBillingModal}
                handleCancelSubscription={handleCancelSubscription}
              />
            )}
            {activeTab === "credits" && (
              <CreditsDetailsTab
                profileData={profile}
                setShowBuyCreditsModal={setShowBuyCreditsModal}
              />
            )}
            {activeTab === "billing" && (
              <BillingDetailsTab profileData={profile} />
            )}
          </div>

          {showPlanModal && (
            <ChangePlanModal
              isOpen={showPlanModal}
              onClose={(shouldRefresh) => {
                setShowPlanModal(false);
                if (shouldRefresh) {
                  fetchProfile();
                }
              }}
              subscription={subscription}
            />
          )}
          {showBillingModal && (
            <BillingHistoryModal
              isOpen={showBillingModal}
              onClose={() => setShowBillingModal(false)}
            />
          )}
          {showBuyCreditsModal && (
            <BuyCreditsModal
              isOpen={showBuyCreditsModal}
              onClose={(shouldRefresh) => {
                setShowBuyCreditsModal(false);
                if (shouldRefresh) {
                  fetchProfile();
                }
              }}
            />
          )}
          {showUpdatePaymentMethodModal && (
            <UpdatePaymentMethodModal
              isOpen={showUpdatePaymentMethodModal}
              onClose={(shouldRefresh) => {
                setShowUpdatePaymentMethodModal(false);
                if (shouldRefresh) {
                  fetchProfile();
                }
              }}
            />
          )}
          {showUpdatePaymentMethodModal && (
            <UpdatePaymentMethodModal
              isOpen={showUpdatePaymentMethodModal}
              onClose={(shouldRefresh) => {
                setShowUpdatePaymentMethodModal(false);
                if (shouldRefresh) {
                  fetchProfile();
                }
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default ProfilePage;
