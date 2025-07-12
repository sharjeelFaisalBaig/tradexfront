"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Image from "next/image";
import SearchIcon from "@/icons/search.svg";
import TemplateFolderIcon from "@/icons/templatefolder.svg";
import { listTemplates } from "@/services/strategy/strategy_API";
import { ITemplate } from "@/lib/folder_types";
import Loader from "@/components/common/Loader";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { endpoints } from "@/lib/endpoints";

export default function TemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const fetched = useRef(false);

  useEffect(() => {
    async function fetchProfile() {
        try {
            const data = await fetchWithAutoRefresh(endpoints.USER.PROFILE, session);
            if (data?.status) {
                setProfile(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    }
    if (session) {
        fetchProfile();
    }
}, [session]);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (session && !fetched.current) {
        fetched.current = true;
        try {
          setLoading(true);
          const res = await listTemplates(session);
          setTemplates(res.data.templates);
        } catch (error: any) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTemplates();
  }, [session]);

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-full max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-10" />
              <Input
                type="text"
                placeholder="Search Templates"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="ml-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md px-4 py-2">
              <span className="text-xl mr-2">＋</span> New Board
            </Button>
          </div>

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader text="Loading templates..." />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {filteredTemplates.map((template, index) => (
                <Card
                  key={template.id}
                  className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-[10px]"
                >
                  <div className="relative pt-3 px-3">
                    <Image
                      src={template.image || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop"}
                      alt={template.name}
                      width={434}
                      height={200}
                      className="w-full h-[200px] object-cover rounded-md"
                      unoptimized
                      priority={index === 0}
                    />
                    <div className="absolute top-5 left-5 bg-white text-[#0088CC] text-xs font-semibold px-[6px] py-[4px] rounded-full flex items-center gap-[0px]">
                      <TemplateFolderIcon className="w-3.5 h-3.5" />
                      <span className="leading-none">Template</span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                    <div className="h-[1px] bg-gray-100 mb-3" />
                    <div className="flex items-center gap-3">
                      <Image
                        src={profile?.user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${profile.user.avatar}` : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"}
                        alt={template.name}
                        width={51}
                        height={51}
                        className="rounded-full border-[4px]"
                        style={{ borderColor: "rgba(0, 136, 204, 0.14)" }}
                      />
                      <div>
                        <p className="text-sm font-medium">{template.author}</p>
                        <p className="text-xs text-gray-400">Updated {new Date(template.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
