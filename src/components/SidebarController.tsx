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
    const matchedKey = Object.keys(config).find((key) =>
      pathname.startsWith(key)
    );

    if (matchedKey) {
      setSidebarType(config[matchedKey]);
    } else {
      setSidebarType("dashboard");
    }
  }, [pathname, config, setSidebarType]);

  return null;
};

export default SidebarController;
