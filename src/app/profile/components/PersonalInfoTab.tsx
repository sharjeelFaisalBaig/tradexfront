import InputField from "@/components/common/InputField";
import DeleteAccountModal from "@/components/modal/DeleteAccountModal";
import React, { MouseEventHandler } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  isDeletingAvatar: boolean;
  profileData?: any;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  setShowUpdatePaymentMethodModal: (val: boolean) => void;
  handleAvatarDelete: MouseEventHandler<HTMLButtonElement>;
}

const PersonalInfoTab = (props: Props) => {
  const {
    isDeletingAvatar,
    profileData,
    email,
    setEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phoneNumber,
    setPhoneNumber,
    setShowUpdatePaymentMethodModal,
    handleAvatarDelete,
  } = props;
  const { user } = profileData;

  const [showDeleteAccountModal, setShowDeleteAccountModal] =
    React.useState(false);

  return (
    <>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <InputField
            label="First Name"
            value={firstName}
            setValue={setFirstName}
          />
          <InputField
            label="Last Name"
            value={lastName}
            setValue={setLastName}
          />
          <InputField
            label="Email"
            value={email}
            setValue={setEmail}
            type="email"
          />
          <InputField
            label="Phone Number"
            value={phoneNumber}
            setValue={setPhoneNumber}
          />
          <InputField
            label="Status"
            value={user.status ? "Active" : "Inactive"}
            setValue={() => {}}
            disabled
          />
          <InputField
            label="Payment Method"
            value={`${user.pm_type} ending in ${user.pm_last_four}`}
            setValue={() => {}}
            disabled
          />
        </div>
        <Button
          className="mt-4"
          onClick={() => setShowUpdatePaymentMethodModal(true)}
        >
          Update Payment Method
        </Button>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-xl font-semibold mb-6 text-destructive">
          Danger Zone
        </h2>

        <div className="flex gap-3">
          <Button
            variant="destructive"
            disabled={isDeletingAvatar}
            onClick={handleAvatarDelete}
          >
            {isDeletingAvatar
              ? // <Loader size="xs" direction="row" />
                "Deleting Avatar..."
              : "Delete Avatar"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteAccountModal(true)}
          >
            Delete Account
          </Button>
        </div>
      </section>

      {showDeleteAccountModal && (
        <DeleteAccountModal
          isOpen={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
        />
      )}
    </>
  );
};

export default PersonalInfoTab;
