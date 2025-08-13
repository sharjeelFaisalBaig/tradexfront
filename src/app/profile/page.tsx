"use client";

import { useEffect, useMemo, useState } from "react";
import ProfileHeader from "./components/ProfileHeader";
import ChangePlanModal from "@/components/modal/ChangePlanModal";
import BillingHistoryModal from "@/components/modal/BillingHistoryModal";
import BuyCreditsModal from "@/components/modal/BuyCreditsModal";
import UpdatePaymentMethodModal from "@/components/modal/UpdatePaymentMethodModal";
import Loader from "@/components/common/Loader";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import PersonalInfoTab from "./components/PersonalInfoTab";
import AccountPreferenceTab from "./components/AccountPreferenceTab";
import SubscriptionDetailsTab from "./components/SubscriptionDetailsTab";
import CreditsDetailsTab from "./components/CreditsDetailsTab";
import BillingDetailsTab from "./components/BillingDetailsTab";
import ProfileSidebar from "./components/ProfileSidebar";
import {
  useGetUser,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useUpdateProfileMutation,
  useCancelSubscriptionMutation,
} from "@/hooks/auth/useAuth";
import { showAPIErrorToast } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import ZeroCreditsWarn from "@/components/common/ZeroCreditsWarn";

const tabs = [
  { name: "Personal Information", value: "personal" },
  { name: "Account Preference", value: "account" },
  { name: "Subscription Details", value: "subscription" },
  { name: "Credits Details", value: "credits" },
  { name: "Billing Details", value: "billing" },
];

function ProfilePage() {
  const successNote = useSuccessNotifier();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "personal";

  // mutations
  const { mutate: uploadAvatar } = useUploadAvatarMutation();
  const { mutate: deleteAvatar } = useDeleteAvatarMutation();
  const { mutate: cancelSubscription } = useCancelSubscriptionMutation();
  const { mutate: updateProfile, isPending: isUpdating } =
    useUpdateProfileMutation();

  // queries
  const {
    refetch: refetchProfile,
    data: userData,
    isLoading,
    isError,
    error,
  } = useGetUser();

  const credits = useMemo(
    () => userData?.data?.credits?.current_credits,
    [userData]
  );

  // modals states
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

  // switch card states
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [receiveSuccessAlerts, setReceiveSuccessAlerts] = useState(true);

  useEffect(() => {
    if (userData?.status && userData?.data?.user) {
      setFirstName(userData?.data.user.first_name || "");
      setLastName(userData?.data.user.last_name || "");
      setEmail(userData?.data.user.email || "");
      setPhoneNumber(userData?.data.user.phone_number || "");
      setAvatar(userData?.data.user.avatar || "");
      setEmailNotifications(!!userData?.data.user.receive_email_notifications);
      setInAppNotifications(!!userData?.data.user.receive_inapp_notifications);
      setTwoFactor(!!userData?.data.user.two_factor_enabled);
      setReceiveSuccessAlerts(!!userData?.data?.user?.receive_success_alerts);
    }
  }, [userData]);

  const subscription = useMemo(() => userData?.data?.subscription, [userData]);

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

    updateProfile(updatedProfile, {
      onSuccess: () => {
        successNote({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      },
      onError: (error) => {
        showAPIErrorToast(error);
      },
    });
  };

  const handleCancelSubscription = async () => {
    cancelSubscription(undefined, {
      onSuccess: () => {
        successNote({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled successfully.",
        });
      },
      onError: (error) => {
        showAPIErrorToast(error);
      },
    });
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData: any = new FormData();
    formData.append("avatar", file);

    uploadAvatar(formData, {
      onSuccess: () => {
        successNote({
          title: "Avatar Uploaded",
          description: "Your avatar has been updated successfully.",
        });
      },
      onError: (error) => {
        showAPIErrorToast(error);
      },
    });
  };

  const handleAvatarDelete = async () => {
    deleteAvatar(undefined, {
      onSuccess: () => {
        successNote({
          title: "Avatar Deleted",
          description: "Your avatar has been deleted successfully.",
        });
      },
      onError: (error) => {
        showAPIErrorToast(error);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
        <Loader text="Loading profile..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-red-600 text-lg font-semibold">
          Failed to load profile.
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {isUpdating && (
        <div className="z-50 absolute top-0 left-0 w-full h-full flex items-center justify-center bg-[#f6f8fb]/50 dark:bg-gray-900/50">
          <Loader text="Updating Profile..." />
        </div>
      )}

      <ProfileHeader onSave={handleSaveChanges} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ProfileSidebar
          profileData={userData?.data}
          handleAvatarUpload={handleAvatarUpload}
        />

        {/* Main Content */}
        <main className="flex-1 px-12 py-10 overflow-y-auto bg-background">
          {!isLoading && (!credits || credits < 1) && (
            <div className="relative mb-12">
              <ZeroCreditsWarn />
            </div>
          )}

          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
              <Loader text="Loading profile..." />
            </div>
          )}

          <div className="flex border-b border-gray-300">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => router.push(`/profile?tab=${tab.value}`)}
                className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
                  activeTab === tab.value
                    ? "border-black dark:border-white text-gray-800 dark:text-white"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeTab === "personal" && (
              <PersonalInfoTab
                profileData={userData?.data}
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
                profileData={userData?.data}
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
                profileData={userData?.data}
                refetchProfile={refetchProfile}
                handleCancelSubscription={handleCancelSubscription}
              />
            )}
            {activeTab === "credits" && (
              <CreditsDetailsTab
                profileData={userData?.data}
                setShowBuyCreditsModal={setShowBuyCreditsModal}
              />
            )}
            {activeTab === "billing" && (
              <BillingDetailsTab profileData={userData?.data} />
            )}
          </div>

          {showPlanModal && (
            <ChangePlanModal
              isOpen={showPlanModal}
              onClose={(shouldRefresh) => {
                setShowPlanModal(false);
                if (shouldRefresh) {
                  refetchProfile();
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
                  refetchProfile();
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
                  refetchProfile();
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
                  refetchProfile();
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
