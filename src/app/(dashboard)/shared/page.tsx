"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchIcon from "@/icons/search.svg";
import SharedWithMeCard from "@/components/shared/SharedWithMeCard";
import SharedWithMeCardCopy from "@/components/shared/SharedWithMeCard copy";
import { useGetSharedStrategies } from "@/hooks/strategy/useStrategyQueries";
import EmptyStrategiesPlaceholder from "@/components/common/EmptyStrategiesPlaceholder";
import { Pagination } from "@/components/common/Pagination";
import { getApiErrorMessage } from "@/lib/utils";
import Loader from "@/components/common/Loader";
import { SharedInvitation } from "@/lib/types";
import _ from "lodash";

const staticSharedStrategies = [
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
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data, isLoading, isError, error } = useGetSharedStrategies({
    search: searchTerm,
    sort_by: "createdAt",
    sort_order: "desc",
  });

  const sharedStrategies: SharedInvitation[] = data?.data || [];

  console.log({ data, sharedStrategies });

  return (
    <>
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
          <span className="text-xl">＋</span> New Board
        </Button>
      </div>

      {isLoading ? (
        <div className="h-4/5 flex items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
          <Loader text="Loading strategies..." />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center p-6">
          <span className="text-red-600 text-lg font-semibold">
            {getApiErrorMessage(error) ?? "Failed to load strategies."}
          </span>
        </div>
      ) : _.isEmpty(sharedStrategies) ? (
        <EmptyStrategiesPlaceholder
          hideButton
          title="You haven’t received any shared strategies yet."
          description="Strategies shared with you by other users will appear here for easy access and collaboration."
        />
      ) : (
        <>
          {/* Strategy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {sharedStrategies.map(
              (strategy: SharedInvitation, index: number) => {
                return (
                  <SharedWithMeCard
                    index={index}
                    strategy={strategy}
                    key={`${strategy.id}-${strategy?.id}`}
                  />
                );
              }
            )}
          </div>
          {/* Pagination */}
          <Pagination
            totalPages={10}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}

      {/* Old Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-10">
        {staticSharedStrategies
          .filter((s) =>
            s?.title?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((strategy, index: number) => (
            <SharedWithMeCardCopy
              index={index}
              strategy={strategy}
              key={`${index}-${strategy?.title}`}
            />
          ))}
      </div>
    </>
  );
}
