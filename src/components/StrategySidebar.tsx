"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BotMessageSquare,
  Circle,
  CircleFadingPlus,
  Diamond,
  FileText,
  Folder,
  Globe,
  GlobeIcon,
  ImageIcon,
  Key,
  LayoutDashboard,
  MicIcon,
  Play,
  Plus,
  SaveAllIcon,
  Settings,
  Type,
} from "lucide-react";
import { useNodeOperations } from "@/app/strategies/[slug]/hooks/useNodeOperations";

const strategyTools = [
  { id: "image", icon: ImageIcon, label: "Images" },
  { id: "audio", icon: MicIcon, label: "Audio" },
  { id: "video", icon: Play, label: "Videos" },
  { id: "document", icon: FileText, label: "Documents" },
  { id: "social", icon: CircleFadingPlus, label: "Social" },
  { id: "remote", icon: GlobeIcon, label: "Website" },
  { id: "AI Assistant", icon: BotMessageSquare, label: "AI Assistant" },
  {
    id: "Save Progress",
    icon: SaveAllIcon,
    label: "Save Progress",
    color: "#0088cc",
  },
];

interface StrategySidebarProps {
  strategyId: string;
}

const StrategySidebar = ({ strategyId }: StrategySidebarProps) => {
  const { addToolNode } = useNodeOperations();

  return (
    <div
      className={
        "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 strategy-sidebar w-16"
      }
    >
      <div className="flex h-full flex-col items-center p-2 space-y-2">
        <Link
          href="/"
          className={
            "w-10 h-10 p-0 rounded-lg transition-all duration-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }
        >
          <LayoutDashboard className="w-5 h-5" />
        </Link>
        {strategyTools?.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={
                "w-10 h-10 p-0 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }
              title={item.label}
              onClick={
                item.id === "Save Progress"
                  ? () => {}
                  : () => addToolNode(item.id, strategyId)
              }
            >
              <Icon
                color={item?.color ?? "rgb(75 85 99)"}
                className="w-5 h-5"
              />
            </Button>
          );
        })}
      </div>
    </div>
  );
};
export default StrategySidebar;
