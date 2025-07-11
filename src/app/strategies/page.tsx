"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SearchIcon from "@/icons/search.svg";
import StrategyCard from "@/components/StrategyCard";
import { favouriteStrategy } from "@/services/strategy/strategy_Mutation";
import { useGetStrategies } from "@/hooks/strategy/useGetStrategies";
import { IStrategy } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

const Strategies = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const [searchTerm, setSearchTerm] = useState("");
  const [starredItems, setStarredItems] = useState<boolean[]>([]);

  const { data, isLoading, isError, error } = useGetStrategies();
  const strategies: IStrategy[] = useMemo(
    () => data?.data?.strategies || [],
    [data]
  );

  useEffect(() => {
    if (error) {
      toast({
        title: error?.message || "Error",
        // @ts-ignore
        description: error?.response?.data?.message || "Failed to send OTP.",
        variant: "destructive",
      });
    }
  }, [error]);

  // Sync starredItems once data is fetched
  useEffect(() => {
    if (strategies.length) {
      // @ts-ignore
      setStarredItems(strategies?.map((s) => s.is_favourite));
    }
  }, [strategies]);

  // Filter based on search
  const filteredStrategies = useMemo(() => {
    return strategies.filter((strategy) =>
      strategy.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [strategies, searchTerm]);

  const toggleStar = async (index: number) => {
    const strategy = filteredStrategies[index]; // filtered index
    const actualIndex = strategies.findIndex((s) => s.id === strategy.id); // for starredItems
    const newIsFavourite = !starredItems[actualIndex];

    try {
      await favouriteStrategy(strategy.id, newIsFavourite, session);
      const updated = [...starredItems];
      updated[actualIndex] = newIsFavourite;
      setStarredItems(updated);
    } catch (error) {
      console.error("Failed to update favourite status", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6">
          {isLoading && <p>Loading...</p>}
          {isError && (
            <p className="text-red-500">Failed to load strategies.</p>
          )}

          {!isLoading && !isError && (
            <>
              {/* Header Controls */}
              <div className="flex items-center justify-between mb-6">
                {/* Search */}
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

                {/* Filters */}
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

              {/* Strategy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredStrategies.map((strategy, index) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    //  isFavorite={starredItems[index]}
                    isFavorite={
                      starredItems[
                        strategies.findIndex((s) => s.id === strategy.id)
                      ]
                    }
                    onClick={() => router.push(`/strategies/${strategy.id}`)}
                    toggleStar={() => toggleStar(index)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pagination (static example) */}
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
};

export default Strategies;
