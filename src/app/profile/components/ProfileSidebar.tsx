import React, { ChangeEventHandler } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CameraIcon } from "lucide-react";
import { getFullUrl } from "@/lib/utils";

interface Props {
  profileData?: any;
  handleAvatarUpload: ChangeEventHandler<HTMLInputElement>;
}
const ProfileSidebar = (props: Props) => {
  const { profileData, handleAvatarUpload } = props;
  const { user } = profileData;

  return (
    <aside className="relative w-64 border-r border-border p-8 bg-background overflow-hidden flex flex-col items-center">
      <div className="relative z-20 flex flex-col items-center">
        <div className="relative mb-4">
          <Avatar className="w-28 h-28">
            <AvatarImage src={user.avatar ? getFullUrl(user.avatar) : ""} />
            <AvatarFallback>
              {user.first_name?.[0] || ""}
              {user.last_name?.[0] || ""}
            </AvatarFallback>
          </Avatar>
          <input
            type="file"
            id="avatar-upload"
            className="hidden"
            onChange={handleAvatarUpload}
            accept="image/*"
          />
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-1 right-1 bg-white dark:bg-background p-1 rounded-full border border-border shadow-sm cursor-pointer"
          >
            <CameraIcon className="w-4 h-4 text-muted-foreground" />
          </label>
        </div>
        <h2 className="text-xl font-semibold mb-1">{user.name}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
