"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import SearchIcon from "@/icons/search.svg";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SharedWithMeCard from "@/components/shared/SharedWithMeCard";

const sharedStrategies = [
  {
    title: "NuAglo Research",
    sharedAgo: "3 days ago",
    category: "#invest",
    image:
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=840&h=420&auto=format&fit=crop",
  },
  {
    title: "NuAglo Research",
    sharedAgo: "3 days ago",
    category: "#invest",
    image:
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=840&h=420&auto=format&fit=crop",
  },
  {
    title: "NuAglo Research",
    sharedAgo: "3 days ago",
    category: "#invest",
    image:
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=840&h=420&auto=format&fit=crop",
  },
  {
    title: "NuAglo Research",
    sharedAgo: "3 days ago",
    category: "#invest",
    image:
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=840&h=420&auto=format&fit=crop",
  },
  {
    title: "NuAglo Research",
    sharedAgo: "3 days ago",
    category: "#invest",
    image:
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=840&h=420&auto=format&fit=crop",
  },
];

export default function SharedWithMe() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Search Bar and New Board Button */}
          <div className="flex items-center justify-between mb-6">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-10" />
              <Input
                type="text"
                placeholder="Search strategies"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* New Board Button */}
            <Button className="ml-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md px-4 py-2">
              <span className="text-xl mr-2">＋</span> New Board
            </Button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {sharedStrategies
              .filter((s) =>
                s.title.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((strategy, index) => (
                <SharedWithMeCard
                  index={index}
                  strategy={strategy}
                  key={`${index}-${strategy.title}`}
                />
              ))}
          </div>

          {/* Pagination */}
          <Pagination>
            <PaginationContent>
              {/* Previous Button */}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#00AA67" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </PaginationLink>
              </PaginationItem>

              {/* Page Numbers */}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#CBD5E0" }}
                >
                  1
                </PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#CBD5E0" }}
                >
                  2
                </PaginationLink>
              </PaginationItem>

              {/* Dots without border */}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ color: "#CBD5E0" }}
                >
                  ...
                </PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#CBD5E0" }}
                >
                  10
                </PaginationLink>
              </PaginationItem>

              {/* Next Button */}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#00AA67" }}
                >
                  <ChevronRight className="w-4 h-4" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </main>
      </div>
    </div>
  );
}
