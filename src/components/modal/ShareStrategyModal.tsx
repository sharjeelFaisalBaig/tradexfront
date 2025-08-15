"use client";
import { X } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { IStrategy, IUser } from "@/lib/types";
import { getFullUrl, showAPIErrorToast } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useShareStrategy } from "@/hooks/strategy/useStrategyMutations";

// Replace with actual API call
const mockUsers: IUser[] = [
  {
    id: 1,
    name: "Sharjeel Baig 1",
    email: "sharjeel1+1@yopmail.com",
    email_verified_at: "2025-05-28T00:04:06.000000Z",
    status: true,
    created_at: "2025-05-27T23:20:51.000000Z",
    updated_at: "2025-08-15T11:23:24.000000Z",
    user_type: "Customer",
    extras: null,
    first_name: "Sharjeel",
    last_name: "Baig",
    otp_expires_at: null,
    stripe_id: "cus_SaFAGNCAvl3xZv",
    pm_type: "visa",
    pm_last_four: "1111",
    trial_ends_at: null,
    google_id: null,
    credits: 6100,
    two_factor_enabled: false,
    two_factor_expires_at: null,
    two_factor_verified_at: null,
    receive_email_notifications: true,
    receive_inapp_notifications: true,
    avatar: "/storage/1773/2857527.png",
    phone_number: "+921234567890",
    receive_success_alerts: true,
  },
  {
    id: 2,
    name: "Sharjeel Baig 2",
    email: "sharjeel1+2@yopmail.com",
    email_verified_at: "2025-05-28T00:04:06.000000Z",
    status: true,
    created_at: "2025-05-27T23:20:51.000000Z",
    updated_at: "2025-08-15T11:23:24.000000Z",
    user_type: "Customer",
    extras: null,
    first_name: "Sharjeel",
    last_name: "Baig",
    otp_expires_at: null,
    stripe_id: "cus_SaFAGNCAvl3xZv",
    pm_type: "visa",
    pm_last_four: "1111",
    trial_ends_at: null,
    google_id: null,
    credits: 6100,
    two_factor_enabled: false,
    two_factor_expires_at: null,
    two_factor_verified_at: null,
    receive_email_notifications: true,
    receive_inapp_notifications: true,
    avatar: "/storage/1773/2857527.png",
    phone_number: "+921234567890",
    receive_success_alerts: true,
  },
  {
    id: 3,
    name: "Sharjeel Baig 3",
    email: "sharjeel1+3@yopmail.com",
    email_verified_at: "2025-05-28T00:04:06.000000Z",
    status: true,
    created_at: "2025-05-27T23:20:51.000000Z",
    updated_at: "2025-08-15T11:23:24.000000Z",
    user_type: "Customer",
    extras: null,
    first_name: "Sharjeel",
    last_name: "Baig",
    otp_expires_at: null,
    stripe_id: "cus_SaFAGNCAvl3xZv",
    pm_type: "visa",
    pm_last_four: "1111",
    trial_ends_at: null,
    google_id: null,
    credits: 6100,
    two_factor_enabled: false,
    two_factor_expires_at: null,
    two_factor_verified_at: null,
    receive_email_notifications: true,
    receive_inapp_notifications: true,
    avatar: "/storage/1773/2857527.png",
    phone_number: "+921234567890",
    receive_success_alerts: true,
  },
];

interface ShareStrategyFormProps {
  onSuccess: (data: IStrategy) => void;
  onClose: () => void;
  strategy?: null | IStrategy;
}

function ShareStrategyForm({
  onSuccess,
  onClose,
  strategy,
}: ShareStrategyFormProps) {
  const successNote = useSuccessNotifier();
  const shareMutation = useShareStrategy();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [suggestions, setSuggestions] = useState<IUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async (query: string) => {
    setIsSearching(true);
    try {
      setSuggestions(
        mockUsers.filter(
          (user) =>
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
        )
      );
    } catch (error) {
      showAPIErrorToast(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      searchUsers(query);
    } else {
      setSuggestions([]);
    }
  };

  const isUserSelected = (user: IUser) => {
    return selectedUsers.some((u) => u.id === user.id);
  };

  const handleSelectUser = (user: IUser) => {
    if (isUserSelected(user)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery("");
  };

  const handleRemoveUser = (userId: string | number) => {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const userIds = selectedUsers.map((user) => String(user.id)) ?? [];
    shareMutation.mutate(
      { strategyId: strategy?.id ?? "", userIds },
      {
        onSuccess: (data) => {
          successNote({
            title: "Strategy Shared",
            description: "Strategy shared successfully.",
          });
          onSuccess(data);
          onClose();
        },
        onError: (error) => {
          showAPIErrorToast(error);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Search Users */}
      <div>
        <label className="block text-sm font-medium mb-1 text-muted-foreground">
          Search Users
        </label>
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={handleSearch}
          disabled={shareMutation.isPending}
        />
        {isSearching && (
          <p className="text-sm text-muted-foreground mt-1">Searching...</p>
        )}
        {suggestions?.length > 0 && (
          <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
            {suggestions?.map((user) => (
              <div
                key={user.id}
                className={`p-2 hover:bg-muted/50 cursor-pointer flex items-center gap-2 ${
                  isUserSelected(user) ? "bg-blue-100 dark:bg-blue-900" : ""
                }`}
                onClick={() => handleSelectUser(user)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={user?.avatar ? `${getFullUrl(user.avatar)}` : ""}
                  />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1 text-muted-foreground">
            Selected Users
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center px-3 py-1 text-sm bg-muted rounded-full"
              >
                <Avatar className="w-6 h-6 mr-2">
                  <AvatarImage
                    src={user?.avatar ? `${getFullUrl(user.avatar)}` : ""}
                  />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {user.name}
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user?.id)}
                  className="ml-2 text-red-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={shareMutation.isPending || selectedUsers.length === 0}
        className="w-full h-11 text-base"
      >
        {shareMutation.isPending ? "Sharing..." : "Share Strategy"}
      </Button>
    </form>
  );
}

export default function ShareStrategyModal({
  isOpen,
  onClose,
  strategy,
}: {
  isOpen: boolean;
  onClose: () => void;
  strategy?: IStrategy | null;
}) {
  const router = useRouter();
  const onSuccess = (strategyData: IStrategy) => {
    router.push(`/strategies/${strategyData.id}`);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center px-4">
        <Dialog.Panel className="relative dark:border dark:border-gray-800 bg-white dark:bg-background w-full max-w-md mx-auto rounded-lg shadow-lg p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <Dialog.Title className="text-xl font-semibold text-center mb-4">
            Share Strategy
          </Dialog.Title>
          <ShareStrategyForm
            strategy={strategy}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
