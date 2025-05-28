"use client";

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
import BellIcon from '../icons/bell.svg';
import Affiliate from '../icons/affiliate.svg';
import UnlockIcon from '../icons/unlock.svg';

const Header = () => {
    const router = useRouter();

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

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center rounded-10p"
                        style={{ paddingTop: '18px', paddingBottom: '18px' }}
                    >
                        <Affiliate
                            width={24}
                            height={24}
                            style={{ objectFit: "contain" }}
                            className="mr-1 shrink-0"
                        />
                        Affiliate
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center rounded-10p"
                        style={{ paddingTop: '18px', paddingBottom: '18px' }}
                    >
                        <UnlockIcon
                            width={24}
                            height={24}
                            style={{ objectFit: "contain" }}
                            className="mr-1 shrink-0"
                        />
                        Unlock $100
                    </Button>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-[22px]">
                <div className="flex items-center gap-[12px]">
                    <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        0/3000 Credits
                    </span>

                    <ThemeToggle />

                    <BellIcon
                        width={48}
                        height={48}
                        style={{ objectFit: "contain" }}
                    />

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
                            <DropdownMenuItem onClick={() => alert("Logged out")}>
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
