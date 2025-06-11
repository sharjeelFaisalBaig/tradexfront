"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { SidebarProvider } from "@/context/SidebarContext";
import SidebarController from "@/components/SidebarController";

const sidebarConfig = {
  "/strategy": "strategy",
};
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <SidebarProvider>
                <SidebarController config={sidebarConfig} />
                {children}
            </SidebarProvider>
        </ThemeProvider>
    );
}
