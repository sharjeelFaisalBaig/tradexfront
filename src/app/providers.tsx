"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { SidebarProvider } from "@/context/SidebarContext";
import SidebarController from "@/components/SidebarController";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ClientWrapper from "@/components/ClientWrapper";
import SessionProvider from "@/components/SessionProvider";

const sidebarConfig = {
  "^/strategies/[^/]+$": "strategy",
};

const queryClient = new QueryClient({});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ClientWrapper>
        <SessionProvider>
          <ThemeProvider>
            <SidebarProvider>
              <SidebarController config={sidebarConfig} />
              {children}
              <Toaster />
            </SidebarProvider>
          </ThemeProvider>
        </SessionProvider>
      </ClientWrapper>
    </QueryClientProvider>
  );
}
