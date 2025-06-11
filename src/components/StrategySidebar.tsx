import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BotMessageSquare, Circle, Diamond, FileText, Folder, Globe, ImageIcon, Key, LayoutDashboard, Play, Plus, Settings, Type } from "lucide-react";

const strategyTools = [
    { id: "image", icon: ImageIcon, label: "Images" },
    { id: "video", icon: Play, label: "Videos" },
    { id: "document", icon: FileText, label: "Documents" },
    { id: "AI Assistant", icon: BotMessageSquare, label: "AI Assistant" },
];
const StrategySidebar = () => {
    return (
        <div className={"bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 strategy-sidebar w-16"} >
            <div className="flex h-full flex-col items-center p-2 space-y-2">
                <Link
                    href="/"
                    className={"w-10 h-10 p-0 rounded-lg transition-all duration-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100"}
                >
                    <LayoutDashboard className="w-5 h-5" />
                </Link>
                {strategyTools.map((item) => {
                    const Icon = item.icon
                    return (
                        <Button
                            key={item.id}
                            variant="ghost"
                            size="sm"
                            className={"w-10 h-10 p-0 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"}
                            title={item.label}
                        >
                            <Icon className="w-5 h-5" />
                        </Button>
                    )
                })}
            </div>
        </div>
    )
};
export default StrategySidebar;