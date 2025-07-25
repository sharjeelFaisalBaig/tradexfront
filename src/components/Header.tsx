"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BellIcon from "../icons/bell.svg";
import Affiliate from "../icons/affiliate.svg";
import UnlockIcon from "../icons/unlock.svg";
import { signOut } from "next-auth/react";
import { useGetUser } from "@/hooks/auth/useAuth";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

interface HeaderInterface {}

const Header = ({}: HeaderInterface) => {
  const router = useRouter();
  const successNote = useSuccessNotifier();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data } = useGetUser();
  const profile = useMemo(() => data?.data, [data]);

  return (
    <header className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
      {/* Left Section */}
      <div className="flex items-center space-x-20">
        <Image
          src="/logo.png"
          alt="Logo"
          width={148}
          height={32}
          className="object-contain mr-6"
        />

        <div className="flex items-center space-x-2 mr-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center rounded-10p"
          >
            <Affiliate />
            Affiliate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center rounded-10p"
          >
            <UnlockIcon />
            Unlock $100
          </Button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-[22px]">
        <div className="flex items-center gap-[12px]">
          <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {profile
              ? `${profile.credits.total_spent_this_month}/${profile.credits.total_earned_this_month} Credits`
              : "0/0 Credits"}
          </span>

          <ThemeToggle />

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-12 h-12 rounded-full border border-[#CDDAE6] flex items-center justify-center"
          >
            {/* Bell Icon inside circle */}
            <BellIcon
              width={24}
              height={24}
              style={{ objectFit: "contain" }}
              className="text-blue-600"
            />

            {/* Green dot */}
            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
          </button>

          {showNotifications && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black/40 z-40"
                onClick={() => setShowNotifications(false)}
              ></div>

              {/* Notification Popup */}
              <div className="absolute right-[100px] top-20 w-[400px] bg-white shadow-xl rounded-xl border border-gray-200 z-50 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b">
                  <h3 className="font-semibold text-lg">
                    Recent Notification
                    <span className="ml-1 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                      1
                    </span>
                  </h3>
                  <button
                    className="text-sm text-[#00AA67] font-medium"
                    onClick={() => router.push("/notification")}
                  >
                    View all
                  </button>
                </div>

                <div className="divide-y">
                  {[
                    { time: "Just now" },
                    { time: "Yesterday" },
                    { time: "2 days ago" },
                    { time: "2 days ago" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`px-4 py-3 ${
                        item.time === "Just now" ? "bg-gray-100" : ""
                      }`}
                    >
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <span className="text-[#00AA67] text-xl leading-none">
                          •
                        </span>
                        Commission received for unit #012
                        <span className="ml-auto text-xs text-gray-500">
                          {item.time}
                        </span>
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        It is a long established fact that a reader will be
                        distracted by the readable content of a page.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-1 cursor-pointer">
                <Avatar>
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                    alt="User"
                  />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  signOut();
                  successNote({
                    title: "Logout successfully",
                  });
                }}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
