"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import SearchIcon from "@/icons/search.svg";
import Loader from "@/components/common/Loader";
import SharedStrategyCard from "@/components/SharedStrategyCard";
import { getMyInvitations, getSharedStrategies, getStrategy } from "@/services/strategy/strategy_API";
import { favouriteStrategy, copyStrategy } from "@/services/strategy/strategy_Mutation";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function SharedWithMe() {
  const { data: session } = useSession();
  // Use any[] because we add _invitation meta
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);

  const fetched = useRef(false);
  const isInitialMount = useRef(true);

  // Fetch invitations and their strategies
  const fetchStrategies = async (search: string = "") => {
    if (!session) return;
    try {
      setLoading(true);
      let invitationsRes;
      if (search) {
        invitationsRes = await getSharedStrategies(session, { search });
      } else {
        invitationsRes = await getMyInvitations(session);
      }
      if (!invitationsRes.status) throw new Error(invitationsRes.message || "Failed to fetch invitations");
      const invitations = invitationsRes.data;
      const strategiesWithMeta = await Promise.all(
        invitations.map(async (inv: any) => {
          const stratRes = await getStrategy(inv.strategy_id, session);
          return {
            ...stratRes.data,
            _invitation: inv,
          };
        })
      );
      setStrategies(strategiesWithMeta);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
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
      fetchStrategies(searchTerm);
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [searchTerm, perPage]);

  // Filter by search
  const filtered = strategies.filter((strategy) =>
    (strategy.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStar = async (index: number) => {
    const strategy = filtered[index];
    try {
      // Optimistically update local state
      setStrategies((prev) =>
        prev.map((s) =>
          s.id === strategy.id
            ? { ...s, is_favorite: !s.is_favorite }
            : s
        )
      );
      await favouriteStrategy(strategy.id, session);
      // Optionally refetch to sync with backend
      fetchStrategies();
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
          <h1 className="text-2xl font-semibold mb-6">Shared With Me</h1>
          {/* Search Bar */}
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
            <Button className="ml-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md px-4 py-2">
              <span className="text-xl mr-2">+</span> New Board
            </Button>
          </div>

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader text="Loading shared strategies..." />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {filtered.map((strategy, index) => (
                  <SharedStrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    invitationMeta={strategy._invitation}
                    isStarred={!!strategy.is_favorite}
                    onStarToggle={() => toggleStar(index)}
                    onCopy={() => handleCopyStrategy(strategy.id)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pagination (static for now) */}
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

