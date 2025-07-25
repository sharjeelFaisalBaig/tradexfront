import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import DashboardIcon from "../icons/dashboardicon.svg";
import Chart from "../icons/chart.svg";
import Strategy from "../icons/mystrategies.svg";
import Recent from "../icons/recent.svg";
import Favorites from "../icons/favorites.svg";
import Templates from "../icons/templates.svg";
import Folder from "../icons/folder.svg";
import ShareBlue from "../icons/shareblue.svg";
import { useSidebar } from "@/context/SidebarContext";
import { useState } from "react";
import NewStrategyModal from "./modal/NewStrategyModal";

const navigation = [
  // { name: "New Strategy", href: "/strategy", icon: Plus },
  { name: "New Strategy", href: "#new-strategy", icon: Plus },
  { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { name: "Charts", href: "/charts", icon: Chart },
  { name: "My Strategies", href: "/strategies", icon: Strategy },
  { name: "Recent", href: "/recent", icon: Recent },
  { name: "Favorites", href: "/favorites", icon: Favorites },
  { name: "Templates", href: "/templates", icon: Templates },
  { name: "Shared with Me", href: "/shared", icon: ShareBlue },
];
const DashboardSidebar = () => {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const [showNewStrategyModal, setShowNewStrategyModal] =
    useState<boolean>(false);

  const toggleNewStrategyModal = () => {
    setShowNewStrategyModal((prev) => !prev);
  };

  return (
    <>
      {showNewStrategyModal && (
        <NewStrategyModal
          isOpen={showNewStrategyModal}
          onClose={toggleNewStrategyModal}
        />
      )}

      <div
        className={cn(
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 dashboard-sidebar",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-end p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 p-0 flex items-center justify-center"
              style={{ width: "-webkit-fill-available" }}
            >
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-[#00AA67] rounded-full"></span>
                <span className="w-2 h-2 bg-[#00AA67] rounded-full"></span>
                <span className="w-2 h-2 bg-[#00AA67] rounded-full"></span>
              </div>
            </Button>
          </div>

          <nav className="flex-1 space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <div key={item.name}>
                  <Link
                    href={item.href || "#"}
                    onClick={() => {
                      item.href === "#new-strategy" && toggleNewStrategyModal();
                    }}
                    className={cn(
                      "group flex px-[8px] py-[15px] text-sm font-medium rounded-[10px] transition-colors",
                      collapsed
                        ? "justify-center items-center"
                        : "items-center",
                      isActive
                        ? "bg-[#00AA67] text-white"
                        : "text-dark-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-6 w-6",
                        !collapsed && "mr-3",
                        isActive ? "text-white" : "text-[#0088CC]"
                      )}
                    />
                    {!collapsed && item.name}
                  </Link>

                  {!collapsed && item.name === "Templates" && (
                    <div className="mt-1">
                      <Link
                        href="/folders"
                        className={cn(
                          "group flex items-center px-[8px] py-[15px] text-sm font-medium rounded-[10px] transition-colors text-dark-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <Folder className="h-6 w-6 mr-3 text-[#0088CC]" />
                        <span className="flex-1">Folders</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        ></Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};
export default DashboardSidebar;
