"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Image from "next/image";
import SearchIcon from "@/icons/search.svg";

const templates = Array(6).fill({
  title: "YT Content System",
  description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  author: "John Smith",
  updated: "Updated 1 month ago",
  image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
});

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active="Templates" />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Search & Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-full max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search strategies or press Ctrl S"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="ml-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md px-4 py-2">
              ＋ New Board
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-28 mr-24">
            {templates
              .filter((t) =>
                t.title.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((template, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-[10px]"
                >
                  <div className="relative pt-3 px-3">
                    <Image
                      src={template.image}
                      alt={template.title}
                      width={434}
                      height={200}
                      className="w-full h-[200px] object-cover rounded-md"
                      unoptimized
                      priority={index === 0}
                    />
                    <div className="absolute top-5 left-5 bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-1 rounded">
                      🧩 Template
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <Image
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"
                        alt="Author"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium">{template.author}</p>
                        <p className="text-xs text-gray-400">{template.updated}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </main>
      </div>
    </div>
  );
}
