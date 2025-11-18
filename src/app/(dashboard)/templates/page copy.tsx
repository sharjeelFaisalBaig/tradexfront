"use client";

import { useState } from "react";
import TemplateFolderIcon from "@/icons/templatefolder.svg";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchIcon from "@/icons/search.svg";
import Image from "next/image";

const templates = Array(6).fill({
  title: "YT Content System",
  description:
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  author: "John Smith",
  updated: "Updated 1 month ago",
  image:
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
});

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      {/* Search & Button */}
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
          <span className="text-xl">＋</span> New Board
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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
                <div className="absolute top-5 left-5 bg-white text-[#0088CC] text-xs font-semibold px-[6px] py-[4px] rounded-full flex items-center gap-[0px]">
                  <TemplateFolderIcon className="w-3.5 h-3.5" />
                  <span className="leading-none">Template</span>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {template.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {template.description}
                </p>
                <div className="h-[1px] bg-gray-100 mb-3" />
                <div className="flex items-center gap-3">
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"
                    alt="Author"
                    width={51}
                    height={51}
                    className="rounded-full border-[4px]"
                    style={{ borderColor: "rgba(0, 136, 204, 0.14)" }}
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
    </>
  );
}
