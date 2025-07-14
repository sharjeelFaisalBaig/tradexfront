import { useSidebar } from "@/context/SidebarContext";
import DashboardSidebar from "./DashboardSidebar";
import StrategySidebar from "./StrategySidebar";
import DashboardIcon from "@/icons/dashboardicon.svg";
import StarIcon from "@/icons/favorites.svg";
import TemplateIcon from "@/icons/templates.svg";
import SharedIcon from "@/icons/shareblue.svg";
import Link from "next/link";

const Sidebar = () => {
  const { sidebarType } = useSidebar();

  return (
    <>
      {sidebarType === "dashboard" && <DashboardSidebar />}
      {/* {sidebarType === "strategy" && <StrategySidebar />} */}
    </>
  );
};

export default Sidebar;
