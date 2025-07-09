// SidebarController.tsx
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

type SidebarMap = {
  [key: string]: "strategy" | "dashboard" | string;
};

interface SidebarControllerProps {
  config: SidebarMap;
}

const SidebarController: React.FC<SidebarControllerProps> = ({ config }) => {
  const pathname = usePathname();
  const { setSidebarType } = useSidebar();

  useEffect(() => {
    let matched = false;

    for (const pattern of Object.keys(config)) {
      const regex = new RegExp(pattern);
      if (regex.test(pathname)) {
        setSidebarType(config[pattern]);
        matched = true;
        break;
      }
    }

    if (!matched) {
      setSidebarType("dashboard");
    }
  }, [pathname, config, setSidebarType]);

  return null;
};

export default SidebarController;
