"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { SidebarProvider } from "@/context/SidebarContext";
import SidebarController from "@/components/SidebarController";
import { SessionProvider } from "next-auth/react";

const sidebarConfig = {
  "/strategy": "strategy",
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SidebarProvider>
          <SidebarController config={sidebarConfig} />
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
