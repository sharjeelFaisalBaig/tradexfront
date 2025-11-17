"use client";
import { X } from "lucide-react";
import { IStrategy } from "@/lib/types";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { getFullUrl, getInitials, showAPIErrorToast } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { useShareStrategy } from "@/hooks/strategy/useStrategyMutations";
import { useSearchUsers } from "@/hooks/invitation/useInvitationQueries";
import Loader from "../common/Loader";
import { useInviteUsers } from "@/hooks/invitation/useInvitationMutation";

interface SearchUserType {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

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
  const shareMutation = useInviteUsers();
  // const shareMutation = useShareStrategy();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<SearchUserType[]>([]);

  const { data: searchData, isLoading: isSearching } =
    useSearchUsers(searchQuery);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const isUserSelected = (user: SearchUserType) => {
    return selectedUsers.some((u) => u.id === user.id);
  };

  const handleSelectUser = (user: SearchUserType) => {
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
    // const userIds = selectedUsers.map((user) => String(user.id)) ?? [];
    const emails = selectedUsers.map((user) => String(user.email)) ?? [];
    shareMutation.mutate(
      { strategyId: strategy?.id ?? "", emails },
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
          <div className="mt-4">
            <Loader size="sm" text="Searching..." />
          </div>
        )}
        {searchData?.data?.length > 0 && (
          <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
            {searchData?.data?.map((user: SearchUserType) => (
              <div
                key={`${user?.id}-${user.email}`}
                className={`p-2 hover:bg-muted/50 cursor-pointer flex items-center gap-2 ${
                  isUserSelected(user) ? "bg-blue-100 dark:bg-blue-900" : ""
                }`}
                onClick={() => handleSelectUser(user)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={user?.avatar ? `${getFullUrl(user.avatar)}` : ""}
                  />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
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
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
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
