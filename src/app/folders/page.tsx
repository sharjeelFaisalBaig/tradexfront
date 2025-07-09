"use client";

import FolderExplorer from "@/components/folder/FolderExplorer";
import Header from "@/components/Header"; // Adjust path if different
import DashboardSidebar from "@/components/DashboardSidebar"; // Adjust path if different

export default function FolderPage() {
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
