"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { SidebarProvider } from "@/context/SidebarContext";
import SidebarController from "@/components/SidebarController";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import {  QueryClient, QueryClientProvider } from "@tanstack/react-query";

const sidebarConfig = {
  "/strategy": "strategy",
};

const queryClient = new QueryClient({});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>  
      <ThemeProvider>
        <SidebarProvider>
          <SidebarController config={sidebarConfig} />
          {children}
          <Toaster/>
        </SidebarProvider>
      </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
