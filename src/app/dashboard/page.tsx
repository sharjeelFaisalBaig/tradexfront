"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import {
  Search,
  Star,
  Clipboard,
  Link2,
  MoreHorizontal,
} from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const strategies = [
  {
    title: "NuAglo Research",
    category: "#invest",
    lastEdited: "2d",
    image:
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=200&fit=crop",
  },
  {
    title: "Momentum Strategy",
    category: "#momentum",
    lastEdited: "4d",
    image:
      "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=200&fit=crop",
  },
  {
    title: "Breakout Trader",
    category: "#breakouts",
    lastEdited: "1w",
    image:
      "https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=400&h=200&fit=crop",
  },
  {
    title: "Scalping Pro",
    category: "#scalping",
    lastEdited: "2d",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
  },
  {
    title: "Option Flow",
    category: "#options",
    lastEdited: "4d",
    image:
      "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=200&fit=crop",
  },
  {
    title: "Future Trader",
    category: "#futures",
    lastEdited: "1w",
    image:
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=200&fit=crop",
  },
];

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Style for pagination arrows buttons (border + rounded + fixed size + center arrow)
  const paginationButtonStyle = {
    fontSize: 0,
    position: "relative" as const,
    width: "2.5rem",
    height: "2.5rem",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    border: "1px solid #ccc",
    borderRadius: "8px",
    color: "inherit",
    cursor: "pointer",
  };

  // Style for the arrow inside the buttons
  const arrowStyle = {
    fontSize: "1.4rem",
    lineHeight: 1,
  };

  // Style for the small icon buttons inside cards (border + rounded + padding + size)
  const iconButtonStyle = {
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "0.15rem",
    minWidth: "28px",
    minHeight: "28px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            {/* Search Bar */}
            <div className="flex items-center max-w-md w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search strategies or press Ctrl + S"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Page Size & Sort */}
            <div className="flex items-center space-x-4">
              <Select defaultValue="10">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="modified">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modified">
                    Sort by: Last Modified
                  </SelectItem>
                  <SelectItem value="name">Sort by: Name</SelectItem>
                  <SelectItem value="created">Sort by: Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {strategies.map((strategy, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-[10px]"
              >
                <CardContent className="p-0">
                  <div className="flex items-start justify-between mt-[30px] px-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {strategy.title}
                    </h3>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="px-5 pt-1 pb-2">
                    <Badge variant="secondary" className="text-xs">
                      {strategy.category}
                    </Badge>
                  </div>

                  <div className="aspect-video px-5 mb-4">
                    <img
                      src={strategy.image}
                      alt={strategy.title}
                      className="w-full h-full object-cover opacity-80 rounded-[10px]"
                    />
                  </div>

                  <div className="px-5 pb-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Last edited {strategy.lastEdited}</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0"
                          style={iconButtonStyle}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0"
                          style={iconButtonStyle}
                        >
                          <Clipboard className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0"
                          style={iconButtonStyle}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  style={paginationButtonStyle}
                  aria-label="Previous page"
                >
                  <span style={arrowStyle}>←</span>
                </PaginationPrevious>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">...</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">10</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  style={paginationButtonStyle}
                  aria-label="Next page"
                >
                  <span style={arrowStyle}>→</span>
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
