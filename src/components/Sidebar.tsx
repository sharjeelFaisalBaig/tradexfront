"use client";

import { useSidebar } from "@/context/SidebarContext";
import DashboardSidebar from "./DashboardSidebar";

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
