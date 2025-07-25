"use client";

import { Button } from "@/components/ui/button";
import {
  BotMessageSquare,
  CircleFadingPlus,
  GlobeIcon,
  ImageIcon,
  FileText,
  MicIcon,
  Play,
  MessageSquare,
} from "lucide-react";
import { useNodeOperations } from "@/app/strategies/[slug]/hooks/useNodeOperations";
import { cn } from "@/lib/utils";
import { useState } from "react";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";

const strategyTools = [
  { id: "annotation", icon: MessageSquare, label: "Annotation" },
  { id: "image", icon: ImageIcon, label: "Image" },
  { id: "audio", icon: MicIcon, label: "Audio" },
  { id: "video", icon: Play, label: "Video" },
  { id: "document", icon: FileText, label: "Document" },
  { id: "social", icon: CircleFadingPlus, label: "Social" },
  { id: "remote", icon: GlobeIcon, label: "Website" },
  { id: "AI Assistant", icon: BotMessageSquare, label: "AI Assistant" },
  // {id: "Save Progress",icon: SaveAllIcon,label: "Save Progress",color: "#0088cc"},
];

interface StrategySidebarProps {
  strategyId: string;
}

const StrategySidebar = ({ strategyId }: StrategySidebarProps) => {
  const { addToolNode } = useNodeOperations();
  const successNote = useSuccessNotifier();
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const handleSavePeersPositions = async () => {
    successNote({
      title: "Peer Positions Saved",
      description: "All peer positions have been successfully saved.",
    });
  };

  return (
    <div
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={cn(
        collapsed ? "w-16" : "w-40",
        "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-linear strategy-sidebar"
      )}
    >
      <div className="flex h-full flex-col items-center p-2 space-y-2">
        {strategyTools?.map((item) => {
          const Icon = item.icon;

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              title={item.label}
              onClick={
                item.id === "Save Progress"
                  ? () => handleSavePeersPositions()
                  : () => addToolNode({ peerType: item.id, strategyId })
              }
              className={cn(
                collapsed
                  ? "w-10 p-0"
                  : "px-2 w-full flex justify-start text-sm font-semibold",
                "group h-10 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon
                className="w-5 h-5"
                // {...(item?.color ? { color: item?.color } : {})}
              />
              <span
                className={cn(
                  collapsed ? "hidden opacity-0" : "opacity-100",
                  "transition-opacity duration-300 ease-in"
                )}
              >
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
export default StrategySidebar;
