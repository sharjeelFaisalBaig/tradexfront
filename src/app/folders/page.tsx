"use client";

import FolderExplorer from "@/components/folder/FolderExplorer";
import Header from "@/components/Header"; // Adjust path if different
import DashboardSidebar from "@/components/DashboardSidebar"; // Adjust path if different

export default function FolderPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        <main className="relative flex-1 overflow-y-auto p-6">
          <FolderExplorer />
        </main>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <DashboardSidebar />
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        {/* Folder Explorer UI */}
        <div className="flex-1 overflow-auto p-4 bg-[#f9f9f9] dark:bg-[#111]">
          <FolderExplorer />
        </div>
      </div>
    </div>
  );
}
