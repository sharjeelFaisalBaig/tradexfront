"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getRecentStrategies } from "@/services/strategy/strategy_API";
import {
  favouriteStrategy,
  copyStrategy,
} from "@/services/strategy/strategy_Mutation";
import { IStrategy } from "@/lib/types";
import SearchIcon from "@/icons/search.svg";
import Loader from "@/components/common/Loader";
import StrategyCard from "@/components/StrategyCard";

const Recent = () => {
  const { data: session } = useSession();
  const [strategies, setStrategies] = useState<IStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [starredItems, setStarredItems] = useState<boolean[]>([]);
  const [perPage, setPerPage] = useState(10);

  const fetched = useRef(false);
  const isInitialMount = useRef(true);

  const fetchStrategies = async () => {
    if (session) {
      try {
        setLoading(true);
        const res = await getRecentStrategies(session, {
          per_page: perPage,
          search: searchTerm,
        });
        setStrategies(res.data.strategies);
        setStarredItems(
          res.data.strategies.map((s: IStrategy) => {
            const ownerCollaborator = s.collaborators?.find(c => c.type === 'owner');
            return !!ownerCollaborator?.is_favourite;
          })
        );
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (session && !fetched.current) {
      fetched.current = true;
      fetchStrategies();
    }
  }, [session]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const debounceFetch = setTimeout(() => {
      fetchStrategies();
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [searchTerm, perPage]);

  const toggleStar = async (index: number) => {
    const strategy = strategies[index];
    try {
      const res = await favouriteStrategy(strategy.id, session);
      if (res.status) {
        const updated = [...starredItems];
        updated[index] = !!res.data.is_favourite;
        setStarredItems(updated);
      }
    } catch (error) {
      console.error("Failed to update favourite status", error);
    }
  };

  const handleCopyStrategy = async (id: string) => {
    try {
      await copyStrategy(id, session);
      fetchStrategies();
    } catch (error) {
      console.error("Failed to copy strategy", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-semibold mb-6">Recent Strategies</h1>
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
              <Select
                onValueChange={(value) => setPerPage(parseInt(value, 10))}
                value={perPage.toString()}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader text="Loading recent strategies..." />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              {/* Strategy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {strategies.map((strategy, index) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    isStarred={starredItems[index]}
                    onStarToggle={() => toggleStar(index)}
                    onCopy={() => handleCopyStrategy(strategy.id)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#00AA67" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </PaginationLink>
              </PaginationItem>

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

export default Recent;