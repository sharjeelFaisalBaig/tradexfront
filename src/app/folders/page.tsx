"use client";

import { useEffect, useState } from "react";
import FolderExplorer from "@/components/folder/FolderExplorer";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/DashboardSidebar";
import { FolderAPI } from "@/services/folder/folder_API";
import { Folder } from "@/lib/folder_types";
import Loader from "@/components/common/Loader";
import { useSession } from "next-auth/react";

export default function FolderPage() {
  const { data: session } = useSession();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFolders = async () => {
      if (session) {
        try {
          const folderData = await FolderAPI.listFolders(session, true); // Fetch as a tree
          setFolders(folderData.data.folders);
        } catch (error) {
          console.error("Failed to fetch folders:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFolders();
  }, [session]);

  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 overflow-auto p-4 bg-[#f9f9f9] dark:bg-[#111]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader />
            </div>
          ) : (
            <FolderExplorer initialFolders={folders} session={session} />
          )}
        </div>
      </div>
    </div>
  );
}
