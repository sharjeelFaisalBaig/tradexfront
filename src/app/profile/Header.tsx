"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeProvider";

interface HeaderProps {
  onBackClick?: () => void;
  onSave?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBackClick, onSave }) => {
  const router = useRouter();
  const { theme } = useTheme();

  const handleBack = () => {
    if (onBackClick) onBackClick();
    else router.replace("/dashboard");
  };

  return (
    <header className="h-20 px-6 border-b border-border bg-background shadow-sm">
      <div className="flex items-center justify-between h-full w-full">
        {/* Left Section: Logo + Back Button */}
        <div className="flex items-center gap-12">
          <Image
            src={
              theme === "dark" ? "/tradex-logo-dark.svg" : "/tradex-logo.svg"
            }
            alt="Tradex AI Logo"
            width={148}
            height={32}
            className="mr-6 object-contain"
            priority
          />
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground text-sm"
          >
            ← Profile Setting
          </Button>
        </div>

        {/* Right Section: Theme Toggle + Save */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            className="bg-[#0088CC] hover:bg-[#0077b3] text-white"
            onClick={onSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
