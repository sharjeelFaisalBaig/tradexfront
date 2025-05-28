import { useState } from "react";
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

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { name: "Charts", href: "/charts", icon: Chart },
  { name: "My Strategies", href: "/strategies", icon: Strategy },
  { name: "Recent", href: "/recent", icon: Recent },
  { name: "Favorites", href: "/favorites", icon: Favorites },
  { name: "Templates", href: "/templates", icon: Templates },
  { name: "Shared with Me", href: "/shared", icon: ShareBlue },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-end p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
          >
            <span className="text-lg">☰</span>
          </Button>
        </div>

        <div className="p-4">
          <Button
            className="w-full text-white pl-[18px] py-[15px] flex items-center justify-start rounded-[10px] bg-custom-green"
          >
            <Plus className="w-6 h-6 mr-2" />
            {!collapsed && "New Strategy"}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <div key={item.name}>
                <Link
                  href={item.href || "#"}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                      : "text-dark-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {!collapsed && item.name}
                </Link>

                {!collapsed && item.name === "Templates" && (
                  <div className="mt-2 px-2">
                    <div className="flex items-center">
                      <Folder className="h-6 w-6 text-gray-500 mr-2" />
                      <span className="text-sm text-dark-gray dark:text-gray-400">
                        Folder
                      </span>
                      <div className="w-[60%]"></div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className=" text-[var(--color-green)]" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
