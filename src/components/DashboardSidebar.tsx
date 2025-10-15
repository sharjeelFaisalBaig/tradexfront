import { Button } from "@/components/ui/button";
import { cn, showAPIErrorToast } from "@/lib/utils";
import { Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import ADashboardIcon from "../icons/Adashboardicon.svg";
import DashboardIcon from "../icons/dashboardicon.svg";
import Chart from "../icons/chart.svg";
import AStrategy from "../icons/Amystrategies.svg";
import Strategy from "../icons/mystrategies.svg";
import ARecent from "../icons/Arecent.svg";
import Recent from "../icons/recent.svg";
import AFavorites from "../icons/Afavorites.svg";
import Favorites from "../icons/favorites.svg";
import ATemplates from "../icons/Atemplates.svg";
import Templates from "../icons/templates.svg";
import Folder from "../icons/folder.svg";
import AShareBlue from "../icons/Ashareblue.svg";
import ShareBlue from "../icons/shareblue.svg";
import { useSidebar } from "@/context/SidebarContext";
import { useCreateStrategy } from "@/hooks/strategy/useStrategyMutations";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import Loader from "./common/Loader";

const navigation = [
  // { name: "New Strategy", href: "/strategy", icon: Plus },
  {
    name: "New Strategy",
    href: "#new-strategy",
    icon: Plus,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: DashboardIcon,
    activeIcon: ADashboardIcon,
  },
  // { name: "Charts", href: "/charts", icon: Chart },
  {
    name: "My Strategies",
    href: "/strategies",
    icon: Strategy,
    activeIcon: AStrategy,
  },
  { name: "Recent", href: "/recent", icon: Recent, activeIcon: ARecent },
  {
    name: "Favorites",
    href: "/favorites",
    icon: Favorites,
    activeIcon: AFavorites,
  },
  {
    name: "Templates",
    href: "/templates",
    icon: Templates,
    activeIcon: ATemplates,
  },
  {
    name: "Shared with Me",
    href: "/shared",
    icon: ShareBlue,
    activeIcon: AShareBlue,
  },
];
const DashboardSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const successNote = useSuccessNotifier();
  const { collapsed, setCollapsed } = useSidebar();

  // mutations
  const { mutate: createStrategy, isPending: isCreatingStrategy } =
    useCreateStrategy();

  const handleCreateStrategy = async () => {
    createStrategy(
      {}, // payload
      {
        onSuccess: (data: any) => {
          successNote({
            title: "Strategy Created",
            description: `Strategy "${data?.data?.name}" created successfully.`,
          });
          router.push(`/strategies/${data?.data?.id}`);
        },
        onError: (error) => {
          showAPIErrorToast(error);
        },
      }
    );
  };

  return (
    <>
      {/* Loader Overlay */}
      {isCreatingStrategy && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-[#f6f8fb]/80 dark:bg-gray-900/80 z-50"
        >
          <Loader text="Please wait, creating strategy..." />
        </div>
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
                <span className="w-2 h-2 bg-[#00AA67] rounded-full" />
                <span className="w-2 h-2 bg-[#00AA67] rounded-full" />
                <span className="w-2 h-2 bg-[#00AA67] rounded-full" />
              </div>
            </Button>
          </div>

          <nav className="flex-1 space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const ActiveIcon = item.activeIcon;
              return (
                <div key={item.name}>
                  <Link
                    href={item.href || "#"}
                    onClick={() => {
                      item.href === "#new-strategy" && handleCreateStrategy();
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
                    {isActive ? (
                      <ActiveIcon
                        className={cn(
                          "h-6 w-6",
                          !collapsed && "mr-3",
                          isActive ? "text-white" : "text-[#0088CC]"
                        )}
                      />
                    ) : (
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          !collapsed && "mr-3",
                          isActive ? "text-white" : "text-[#0088CC]"
                        )}
                      />
                    )}

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
